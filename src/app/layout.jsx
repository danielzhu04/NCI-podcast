export const metadata = {
  title: "NCI Signal — This week in NCI-supported cancer research",
  description: "A weekly AI podcast on the NCI-supported cancer paper that drew the most PubMed attention, plus the data, code, and tools it left behind.",
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
