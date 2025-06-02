export const FeaturesData: {
  imgSrc: string;
  heading: string;
  subheading: string;
}[] = [
    // {
    //   imgSrc: '/images/features/featureOne.svg',
    //   heading: "Menu variations",
    //   subheading: "Sed ut perspiciatis unde omnis iste natus error",
    // },
    {
      imgSrc: '/images/features/nails-1.png',
      heading: "Vinylux Nails",
      subheading: "Sed ut perspiciatis unde omnis iste natus error",
    },
    {
      imgSrc: '/images/features/shellacs-1.png',
      heading: "Shellac Nails & Pedicure",
      subheading: "Sed ut perspiciatis unde omnis iste natus error",
    },
    {
      imgSrc: '/images/features/waxing-1.jpg',
      heading: "Waxing & Threading",
      subheading: "Sed ut perspiciatis unde omnis iste natus error",
    },
    {
      imgSrc: '/images/features/eyes.png',
      heading: "Eyebrows & Eyelashes",
      subheading: "Sed ut perspiciatis unde omnis iste natus error",
    },
  ]

// data.tsx
export interface ChildTreatment {
  name: string;
  price: string;
  // (add stripelink or other fields here if needed)
}

export interface Treatment {
  name: string;
  time?: string;          // present only for single‐option treatments
  price?: string;         // present only for single‐option treatments
  children?: ChildTreatment[]; 
}

export interface TreatmentSection {
  title: string;
  treatments: Treatment[];
}

export const TreatmentSections: TreatmentSection[] = [
  {
    title: 'Vinylux Nails',
    treatments: [
      {
        name: 'Vinylux (normal nail polish) manicure',
        time: '30 mins',
        price: '£18',
      },
      {
        name: 'Vinylux French Manicure',
        time: '45 mins',
        price: '£20',
      },
      {
        name: 'Manicure with Top Coat Only',
        children: [
          {
            name: '30 mins',
            price: '£13',
          },
          {
            name: '20 mins',
            price: '£13',
          },
        ],
      },
      {
        name: 'Acrylic nails extension',
        time: '1 hr',
        price: '£30',
      },
      {
        name: 'File & Polish',
        time: '20 mins',
        price: '£15',
      },
      {
        name: 'Acrylic',
        time: '1 hr',
        price: '£30',
      },
      {
        name: 'French File & Polish',
        time: '30 mins',
        price: '£25',
      },
      {
        name: 'Cut Down & File',
        time: '15 mins',
        price: '£10',
      },
      {
        name: 'Little Princess Nails (Under 11)',
        children: [
          {
            name: 'File & Polish - 20 mins',
            price: '£13',
          },
          {
            name: 'Little Princess Minx - 30 mins',
            price: '£15',
          },
        ],
      },
    ],
  },

  {
    title: 'Shellac Nails & Pedicure',
    treatments: [
      {
        name: 'Shellac Manicure',
        time: '30 mins', 
        price: '£22'
      },
      {
        name: 'Shellac toes',
        time: '30 mins',
        price: '£30',
      },
      {
        name: 'Shellac French Manicure',
        time: '30 mins',
        price: '£25',
      },
      {
        name: 'Shellac Removal',
        children: [
          { name: '15 mins', price: '£10' },
          { name: 'Shellac removal & shape - 20 mins', price: '£10' },
        ],
      },
      {
        name: 'Shellac Single Nail Repair',
        time: '10 mins',
        price: '£4',
      },
      {
        name: 'Shellac (hand & toes)',
        time: '1 hr',
        price: '£52',
      },
      {
        name: 'Shellac Manicure & Pedicure',
        time: '1 hr',
        price: '£52',
      },
    ],
  },

  {
    title: 'Waxing & Threading',
    treatments: [
      {
        name: 'Facial Waxing',
        children: [
          { name: 'Chin – 10 mins', price: '£5' },
          { name: 'Lip – 10 mins', price: '£5' },
          { name: 'Eyebrows – 15 mins', price: '£10' },
          { name: 'Neck – 10 mins', price: '£6' },
          { name: 'Sides – 10 mins', price: '£10' },
          { name: 'Full Face – 20 mins', price: '£30' },
        ],
      },
      {
        name: 'Facial Threading',
        children: [
          { name: 'Chin – 10 mins', price: '£4' },
          { name: 'Forehead – 10 mins', price: '£4' },
          { name: 'Upper Lip – 10 mins', price: '£4' },
          { name: 'Neck – 15 mins', price: '£5' },
          { name: 'Sides – 15 mins', price: '£8' },
          { name: 'Full Face – 30 mins', price: '£25' },
        ],
      },
      {
        name: "Ladies' Waxing - Leg",
        children: [
          { name: 'Half Leg – 30 mins', price: '£20' },
          { name: 'Full Leg – 45 mins', price: '£35' },
        ],
      },
      {
        name: "Ladies' Waxing - Arm & Underarm",
        children: [
          { name: 'Fingers – 10 mins', price: '£5' },
          { name: 'Underarm – 10 mins', price: '£10' },
          { name: 'Half Arm – 15 mins', price: '£15' },
          { name: 'Full Arm – 20 mins', price: '£20' },
        ],
      },
      {
        name: "Ladies' Waxing - Full Body",
        time: '1 hr 30 mins',
        price: '£80',
      },
    ],
  },

  {
    title: 'Eyebrows & Eyelashes',
    treatments: [
      {
        name: 'Eyebrow & Eyelash Tinting',
        children: [
          { name: '10 mins', price: '£8' },
          { name: '20 mins', price: '£8' },
        ],
      },
      {
        name: 'Eyebrows shape & tint',
        children: [
          { name: '20 mins', price: '£17' },
          { name: '30 mins', price: '£17' },
        ],
      },
      {
        name: 'Eyebrow Shape & Eyelash Tint',
        time: '30 mins',
        price: '£22',
      },
      {
        name: 'Eyebrow & Eyelash Tint with Eyebrow Shape (package)',
        time: '30 mins',
        price: '£28',
      },
      {
        name: 'Eyebrow Waxing',
        time: '10 mins',
        price: '£10',
      },
      {
        name: 'Eyebrow Threading',
        time: '10 mins',
        price: '£9',
      },
      {
        name: 'Eyebrow Shape and Henna',
        time: '45 mins',
        price: '£23',
      },
      {
        name: 'Lash Extensions - (Party Lashes) full set',
        time: '20 mins',
        price: '£22',
      },
    ],
  }

];


export const ExpertData: {
  profession: string;
  name: string;
  imgSrc: string;
}[] = [
    {
      profession: 'Senior Chef',
      name: 'Shoo Thar Mien',
      imgSrc: '/images/Expert/boyone.svg',
    },
    {
      profession: 'Junior Chef',
      name: 'Shoo Thar Mien',
      imgSrc: '/images/Expert/boytwo.svg',
    },
    {
      profession: 'Junior Chef',
      name: 'Shoo Thar Mien',
      imgSrc: '/images/Expert/girl.png',
    }
  ]

// data.tsx
export const galleryImages = [
  { src: '/images/Gallery/foodone.jpg', name: 'Caesar Salad(187 Kcal)', price: 35 },
  { src: '/images/Gallery/foodtwo.jpg', name: 'Christmas salad(118 Kcal)', price: 17 },
  { src: '/images/Gallery/foodthree.jpg', name: 'Sauteed mushrooms with pumpkin and sweet pepper(238 kcal)', price: 45 },
  { src: '/images/Gallery/foodfour.jpg', name: 'BBQ Chicken Feast Pizza(272 kcal)', price: 27 },
];
