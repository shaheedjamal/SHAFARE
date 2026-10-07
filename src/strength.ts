export function strength(pw: string) {
  let pool = 0
  if (/[a-z]/.test(pw)) pool += 26; if (/[A-Z]/.test(pw)) pool += 26; if (/\d/.test(pw)) pool += 10; if (/[^A-Za-z0-9]/.test(pw)) pool += 32
  const bits = pw ? Math.round(pw.length * Math.log2(Math.max(pool, 2))) : 0
  const level = bits < 28 ? 0 : bits < 36 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4
  return { bits, level, label: ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][level], color: ['#EF4444', '#F59E0B', '#F59E0B', '#22C55E', '#22C55E'][level] }
}
