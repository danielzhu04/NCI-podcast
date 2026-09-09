export const metadata = {
  title: "Genome Lens — Ma'ayan Lab Podcast",
  description: "AI-generated podcast episodes from the Ma'ayan Lab. Axiom and Trinity decode published papers into accessible, synthesized conversations.",
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
