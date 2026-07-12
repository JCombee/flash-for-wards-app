// Vite resolves asset imports to a URL string at build time.
declare module '*.svg' {
  const src: string
  export default src
}
