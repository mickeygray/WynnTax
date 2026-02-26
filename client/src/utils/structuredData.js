// utils/structuredData.js

const organization = {
  "@type": "Organization",
  name: "Wynn Tax Solutions",
  url: "https://wynntaxsolutions.com",
  logo: "https://wynntaxsolutions.com/images/og-default.png",
  telephone: "+1-844-996-6829",
  address: {
    "@type": "PostalAddress",
    streetAddress: "21625 Prairie Street, Suite #200",
    addressLocality: "Chatsworth",
    addressRegion: "CA",
    postalCode: "91311",
    addressCountry: "US",
  },
};

export const orgSchema = {
  "@context": "https://schema.org",
  ...organization,
};

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Wynn Tax Solutions",
  image: "https://wynntaxsolutions.com/images/og-default.png",
  url: "https://wynntaxsolutions.com",
  telephone: "+1-844-996-6829",
  priceRange: "$$",
  address: organization.address,
  geo: {
    "@type": "GeoCoordinates",
    latitude: 34.2572,
    longitude: -118.5981,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "07:00",
    closes: "17:00",
  },
  areaServed: { "@type": "Country", name: "US" },
};

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What services do you offer?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We offer tax preparation, tax consultation, tax resolution, tax negotiation, and protection plans. Whether you need help with IRS notices, tax debt settlement, or proactive planning, we have the expertise to assist you.",
      },
    },
    {
      "@type": "Question",
      name: "How does the tax resolution process work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The process begins with a consultation to understand your tax issues and financial situation. From there, we identify the best resolution options, such as installment agreements, penalty abatements, or offers in compromise. We handle communication with the IRS on your behalf.",
      },
    },
    {
      "@type": "Question",
      name: "What is the difference between tax resolution and tax negotiation?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Tax resolution refers to the overall process of resolving tax debt or disputes with the IRS, while tax negotiation focuses specifically on working with the IRS to establish payment plans, reduce penalties, or settle for less than the full amount owed.",
      },
    },
    {
      "@type": "Question",
      name: "How long does it take to resolve tax debt?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The time frame varies depending on the complexity of your case and the resolution method. Some cases may be resolved in a few weeks, while others can take several months.",
      },
    },
    {
      "@type": "Question",
      name: "Can you help with state tax issues?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, we can assist with state tax issues, including back taxes, liens, and penalties. Our team is experienced in dealing with both federal and state tax authorities.",
      },
    },
    {
      "@type": "Question",
      name: "What is a Tax Protection Plan, and which one should I choose?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our Tax Protection Plans provide proactive support including audit defense, IRS communication, and tax planning. We offer Standard, Premium, and Professional plans with different levels of coverage.",
      },
    },
    {
      "@type": "Question",
      name: "Will you represent me in an IRS audit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, we provide full audit representation to protect your rights and ensure your case is handled properly.",
      },
    },
    {
      "@type": "Question",
      name: "What is an Offer in Compromise, and how do I qualify?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "An Offer in Compromise allows taxpayers to settle their tax debt for less than the full amount owed. Eligibility depends on your financial situation and ability to pay.",
      },
    },
    {
      "@type": "Question",
      name: "How do I get started?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Reach out to schedule a consultation. We'll review your situation, answer questions, and recommend the best solutions to resolve your tax challenges.",
      },
    },
  ],
};

export const serviceSchema = (name, description, serviceType) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name: name,
  description: description,
  provider: organization,
  areaServed: { "@type": "Country", name: "US" },
  serviceType: serviceType,
});

export const blogPostingSchema = (blog) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: blog.contentTitle,
  description: blog.teaser,
  image: blog.image?.startsWith("http")
    ? blog.image
    : `https://wynntaxsolutions.com${blog.image}`,
  author: organization,
  publisher: {
    "@type": "Organization",
    name: "Wynn Tax Solutions",
    logo: {
      "@type": "ImageObject",
      url: "https://wynntaxsolutions.com/images/og-default.png",
    },
  },
  url: `https://wynntaxsolutions.com/tax-news/${blog.id}`,
  mainEntityOfPage: `https://wynntaxsolutions.com/tax-news/${blog.id}`,
});

export const statePageSchema = (state) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name: `${state.name} Tax Relief Services`,
  description:
    state.summary ||
    `Tax relief and resolution services for ${state.name} residents. Help with ${state.taxAuthority} and IRS issues.`,
  provider: organization,
  areaServed: {
    "@type": "State",
    name: state.name,
    containedInPlace: { "@type": "Country", name: "US" },
  },
  serviceType: "Tax Relief",
  url: `https://wynntaxsolutions.com/state-tax-guide/${state.slug}`,
});
