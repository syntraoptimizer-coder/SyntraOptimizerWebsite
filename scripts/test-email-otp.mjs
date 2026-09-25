import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
// Exercise the actual form handlers with a small hook harness and a fake auth server.
// No real emails, sessions or account settings are changed.
function load(file, overrides = {}) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module, exports: module.exports,
    require: (id) => overrides[id] ?? require(id),
    setTimeout, clearTimeout,
  });
  return module.exports;
}
const otpHelpers = load('lib/otp.ts');

function harness(file, props) {
  const state = [];
  let cursor = 0;
  let mounted = false;
  let effects = [];
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], (value) => { state[index] = value; }];
    },
    useEffect(fn) { if (!mounted) effects.push(fn); },
    useCallback(fn) { return fn; },
  };
  const Component = load(file, { react, '@/lib/otp': otpHelpers }).default;
  let tree;
  function render() { cursor = 0; tree = Component(props); mounted = true; }
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    if (typeof node.type === 'function') return nodes(node.type(node.props));
    return [node, ...nodes(node.props?.children)];
  }
  render();
  return {
    async flush() {
      for (const effect of effects) effect();
      effects = [];
      await new Promise(setImmediate);
      render();
    },
    find(predicate) { const node = nodes(tree).find(predicate); assert.ok(node, 'Expected form control'); return node; },
    change(predicate, value) { this.find(predicate).props.onChange({ target: { value } }); render(); },
    render,
  };
}
const text = (node) => typeof node === 'string' ? node : Array.isArray(node)
  ? node.map(text).join('') : text(node?.props?.children ?? '');
const button = (label) => (node) => node.type === 'button' && text(node).includes(label);
const input = (node) => node.type === 'input' && node.props.autoComplete === 'one-time-code';

function server(enabled = false) {
  const verified = [];
  const settings = [];
  return {
    verified, settings,
    auth: {
      mfa: { listFactors: async () => ({ data: { totp: [] } }),
        getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: 'aal1', nextLevel: 'aal1' } }) },
      signInWithPassword: async () => ({ error: null }),
      signOut: async () => ({}), signInWithOtp: async () => ({ error: null }),
      verifyOtp: async (args) => { verified.push(args); return { error: null }; },
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { email_2fa: enabled } }) }) }) }),
    rpc: async (name, args) => {
      if (name === 'email_2fa_required') return { data: true };
      settings.push(args.p_enabled); return { error: null };
    },
  };
}

for (const code of ['012345', '01234567', '0123456789']) {
  for (const enabled of [false, true]) {
    test(`${code.length}-digit email code is sent intact when turning 2FA ${enabled ? 'off' : 'on'}`, async () => {
      const sb = server(enabled);
      const form = harness('components/TwoFactorCard.tsx', { sb, user: { id: 'test', email: 'test@example.com' } });
      await form.flush();
      await form.find(button(enabled ? 'Turn off' : 'Email me a code')).props.onClick();
      await form.flush();
      form.change(input, code);
      const verify = form.find(button('Verify'));
      assert.equal(verify.props.disabled, false);
      await verify.props.onClick();
      await form.flush();
      assert.equal(sb.verified[0].token, code);
      assert.equal(sb.verified[0].type, 'email');
      assert.equal(sb.settings[0], !enabled);
    });
  }
  test(`${code.length}-digit code is sent intact during sign-in`, async () => {
    const sb = server(); let done = false;
    const form = harness('components/EmailPasswordForm.tsx', { sb, onDone: () => { done = true; } });
    form.change((n) => n.props.id === 'ep-email' && n.type === 'input', 'test@example.com');
    form.change((n) => n.props.id === 'ep-password' && n.type === 'input', 'test-password');
    await form.find((n) => n.type === 'form').props.onSubmit({ preventDefault() {} });
    await form.flush();
    assert.equal(done, false);
    form.change(input, code);
    await form.find((n) => n.type === 'form').props.onSubmit({ preventDefault() {} });
    assert.equal(sb.verified[0].token, code);
    assert.equal(done, true);
  });
}
test('Pasting preserves leading zeros and removes spaces without truncation', () => {
  assert.equal(otpHelpers.normalizeOtp(' 0123 4567\n'), '01234567');
  for (const code of ['12345', '12345678901', '123456x']) assert.equal(otpHelpers.isEmailOtp(code), false);
  assert.equal(otpHelpers.isTotp('012345'), true);
  assert.equal(otpHelpers.isTotp('01234567'), false);
});

test('A rejected eight-digit code cannot change security settings', async () => {
  const sb = server();
  sb.auth.verifyOtp = async () => ({ error: { code: 'otp_expired' } });
  const form = harness('components/TwoFactorCard.tsx', { sb, user: { id: 'test', email: 'test@example.com' } });
  await form.flush();
  await form.find(button('Email me a code')).props.onClick();
  await form.flush();
  form.change(input, '01234567');
  await form.find(button('Verify')).props.onClick();
  await form.flush();
  assert.equal(sb.settings.length, 0);
  assert.equal(form.find(input).props.value, '');
  form.find((n) => n.type === 'p' && text(n).includes('invalid, expired, or already used'));
});
