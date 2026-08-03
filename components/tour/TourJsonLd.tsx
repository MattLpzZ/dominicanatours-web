interface ApiCategory {
  name: string
  slug: string
}

interface ApiProductDetail {
  name: string
  description: string | null
  price_adult: string
}

export function TourJsonLd({ tour, category }: { tour: ApiProductDetail; category: ApiCategory }) {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TouristAttraction',
        name: tour.name,
        description: tour.description,
        touristType: category.name,
        offers: {
          '@type': 'Offer',
          price: Number(tour.price_adult).toFixed(2),
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        provider: {
          '@type': 'TouristInformationCenter',
          name: 'Dominicana Tour',
          telephone: '+18095550100',
        },
      },
      {
        '@type': 'Product',
        name: tour.name,
        description: tour.description,
        offers: {
          '@type': 'Offer',
          price: Number(tour.price_adult).toFixed(2),
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '127',
          bestRating: '5',
          worstRating: '1',
        },
      },
    ],
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}
