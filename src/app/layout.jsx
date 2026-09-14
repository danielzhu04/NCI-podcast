export const metadata = {
  title: "NCI Signal — High-impact NCI-supported papers",
  description: "AI-generated podcast episodes that unpack high-impact National Cancer Institute-supported papers and the data, code, and tools they leave behind.",
  icons: {
    icon: 'https://s3.k8s.maayanlab.cloud/axiom-podcasts/favicon.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  )
}
