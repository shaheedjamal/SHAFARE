import { ReactNode } from 'react'
const Doc = ({ title, children }: { title: string; children: ReactNode }) => (
  <main className="mx-auto max-w-2xl px-4 py-10"><h1 className="mb-6 text-2xl font-semibold">{title}</h1><div className="space-y-4 text-sm leading-relaxed text-fg2">{children}</div></main>
)
export const About = () => (<Doc title="About SHAFARE">
  <p>SHAFARE is a collection of everyday tools in one place. Open, find, use, finish.</p>
  <p>[EDIT: Add your company or developer name, mission, and contact email here.]</p></Doc>)
export const Privacy = () => (<Doc title="Privacy Policy">
  <p>Last updated: [EDIT: date]</p>
  <p>SHAFARE tools process files, images, text and notes in your browser. By default this data is not uploaded. Favorites, history, notes and settings are stored on your device and can be deleted from Settings.</p>
  <p>If you create an account, we store your email, name, optional profile photo, password (as a salted bcrypt hash, never in plain text) and the favorites, history and notes you choose to sync. Sign-in sessions use short-lived tokens and a rotating, revocable refresh token you can manage under Account, Security.</p>
  <p>For security we keep an audit log of account events (such as sign-ins, failed attempts and password changes) including IP address and device description. Anonymous tool-usage counts are collected only if you leave that option on in Privacy settings.</p>
  <p>The QR scanner uses your camera only while scanning; video is processed on your device.</p>
  <p>[EDIT: Add your company details, data retention periods, any analytics or advertising services, and a contact address for privacy requests.]</p></Doc>)
export const Terms = () => (<Doc title="Terms of Use">
  <p>Last updated: [EDIT: date]</p>
  <p>SHAFARE is provided "as is" without warranties. Results from calculators and converters are informational and should be verified before financial, medical or legal use.</p>
  <p>[EDIT: Add governing law, liability terms and contact details.]</p></Doc>)
export const Contact = () => (<Doc title="Contact">
  <p>Questions, feedback or a tool request? We’d like to hear from you.</p>
  <p>[EDIT: Add your contact email address or support link here.]</p></Doc>)
