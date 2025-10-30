const makeUserPayload = (suffix, overrides = {}) => {
  const base = {
    email: `${suffix}@example.com`,
    password: 'Passw0rd!',
    username: suffix,
    fullname: `User ${suffix}`,
  }
  return { ...base, ...overrides }
}

module.exports = { makeUserPayload }

