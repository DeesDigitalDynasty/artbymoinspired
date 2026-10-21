export type ArtworkCategory = 'physical' | 'digital';

export type GridPlacement =
  | 'featured-left'
  | 'offset-right'
  | 'center-overlap'
  | 'wide-left'
  | 'tall-right'
  | 'wide-overlap';

export interface ArtworkItem {
  id: string;
  catalogNumber: string;
  title: string;
  category: ArtworkCategory;
  imageUrl: string;
  medium: string;
  artStyle: string;
  paintUsed: string;
  dimensions: string;
  year: string;
  tags: string[];
  description: string;
  gridPlacement: GridPlacement;
  source?: 'curated' | 'upload';
}

export const INITIAL_ARTWORKS: ArtworkItem[] = [
  {
    id: 'mo-art-01',
    catalogNumber: 'MO. 2025.01',
    title: 'Chromatic Muse in Lilac Frame',
    category: 'digital',
    imageUrl: '/assets/artworks/mo_work_01.svg',
    medium: 'Digital Painting & Archival Pigment Print',
    artStyle: 'Neo-Cubist Color Field',
    paintUsed: 'Procreate Hard-Edge Ink & Saturated Gouache Fills',
    dimensions: '3000 x 3800 px (80 x 100 cm)',
    year: '2025',
    tags: ['Neo-Cubism', 'Color Block', 'Portrait', 'Stained Glass'],
    description:
      'Framed within architectural lilac borders, bold planes of crimson, cobalt blue, marigold yellow, and emerald intersect across a single contemplative gaze.',
    gridPlacement: 'featured-left',
    source: 'curated',
  },
  {
    id: 'mo-art-02',
    catalogNumber: 'MO. 2025.02',
    title: 'Rhythm of Crimson Marks',
    category: 'physical',
    imageUrl: '/assets/artworks/mo_work_02.svg',
    medium: 'Acrylic, Ink & Stipple on Canvas',
    artStyle: 'Contemporary Afro-Symbolism',
    paintUsed: 'Mars Black Acrylic, Cadmium Red Ink & Yellow Ochre Stipple',
    dimensions: '100 x 120 cm',
    year: '2025',
    tags: ['Afro-Symbolism', 'Pattern', 'Figurative', 'Red & Black'],
    description:
      'A central figure wreathed in sculptural black forms rests against a rhythmic grid of crimson double-stroke marks, punctuated by stippled gold lower lids.',
    gridPlacement: 'offset-right',
    source: 'curated',
  },
  {
    id: 'mo-art-03',
    catalogNumber: 'MO. 2025.03',
    title: 'Duality in Cobalt & Rose',
    category: 'digital',
    imageUrl: '/assets/artworks/mo_work_03.svg',
    medium: 'Digital Illustration on Hahnemuhle Rag',
    artStyle: 'Surrealist Pop Figuration',
    paintUsed: 'Custom Vector Ink & Matte Acrylic Shaders',
    dimensions: '4000 x 3000 px (100 x 75 cm)',
    year: '2025',
    tags: ['Duality', 'Color Field', 'Portrait', 'Cobalt'],
    description:
      'Set against an electric cobalt field, a rose-pink halo frames a bisected violet and tangerine visage adorned with calligraphic spiral cheek motifs.',
    gridPlacement: 'center-overlap',
    source: 'curated',
  },
  {
    id: 'mo-art-04',
    catalogNumber: 'MO. 2025.04',
    title: 'Triad Crown (MO25)',
    category: 'physical',
    imageUrl: '/assets/artworks/mo_work_04.svg',
    medium: 'India Ink & Fineliner on Heavyweight Cotton Paper',
    artStyle: 'Geometric Line Cubism',
    paintUsed: 'Archival Carbon Black Ink & Technical Nib Pens',
    dimensions: '70 x 100 cm',
    year: '2025',
    tags: ['Monochrome', 'Line Art', 'Cubism', 'Signed MO25'],
    description:
      'Three interlocking faces share a crowned third eye inscribed MO25, weaving chevron, wave, and dot ornamentation into a unified architectural portrait.',
    gridPlacement: 'wide-left',
    source: 'curated',
  },
  {
    id: 'mo-art-05',
    catalogNumber: 'MO. 2025.05',
    title: 'Prismatic Fractures I',
    category: 'physical',
    imageUrl: '/assets/artworks/mo_work_05.svg',
    medium: 'Acrylic & Ink Line on Unbleached Panel',
    artStyle: 'Geometric Hard-Edge Abstraction',
    paintUsed: 'Matte Acrylics in Magenta, Teal, Forest Green, Ochre & Cobalt',
    dimensions: '90 x 130 cm',
    year: '2025',
    tags: ['Geometric', 'Abstract', 'Color Study', 'Hard-Edge'],
    description:
      'Intersecting linear vectors divide warm parchment into jewel-toned facets of magenta, deep forest green, burnt orange, and ultramarine.',
    gridPlacement: 'tall-right',
    source: 'curated',
  },
  {
    id: 'mo-art-06',
    catalogNumber: 'MO. 2025.06',
    title: 'Twin Reflections & Teardrops',
    category: 'digital',
    imageUrl: '/assets/artworks/mo_work_06.svg',
    medium: 'Digital Mixed Media & Line Print',
    artStyle: 'Neo-Expressionist Diptych',
    paintUsed: 'Digital Ink, Primary Pigment Fills & Linear Hatching',
    dimensions: '3200 x 4200 px (80 x 105 cm)',
    year: '2025',
    tags: ['Diptych', 'Geometric', 'Figurative', 'Primary Accents'],
    description:
      'A mirrored diptych exploring stoicism and vulnerability, contrasting vivid green eyelids and crimson-and-black angular lips over horizontal linear strata.',
    gridPlacement: 'wide-overlap',
    source: 'curated',
  },
  {
    id: 'mo-art-07',
    catalogNumber: 'MO. 2025.07',
    title: "Cipher & Glyph Portrait ('25)",
    category: 'physical',
    imageUrl: '/assets/artworks/mo_work_07.svg',
    medium: 'Black Ink on Archival Bristol Board',
    artStyle: 'Symbolic Linear Minimalism',
    paintUsed: 'Sumi Ink & Precision Calligraphic Brushes',
    dimensions: '75 x 100 cm',
    year: '2025',
    tags: ['Monochrome', 'Glyphs', 'Portrait', 'Signed Mo 25'],
    description:
      'A serene figure wearing a striped architectural headdress emerges from a matrix of hand-drawn asemic glyphs and symbolic shorthand.',
    gridPlacement: 'featured-left',
    source: 'curated',
  },
  {
    id: 'mo-art-08',
    catalogNumber: 'MO. 2020.01',
    title: 'Reverie in Amber Waves (Mo20)',
    category: 'digital',
    imageUrl: '/assets/artworks/mo_work_08.svg',
    medium: 'Digital Ink & Warm Pastel Wash',
    artStyle: 'Minimalist Figurative Illustration',
    paintUsed: 'Procreate Studio Ink & Warm Naples Yellow Field',
    dimensions: '3000 x 3000 px (80 x 80 cm)',
    year: '2020',
    tags: ['Amber', 'Line Art', 'Archive Mo20', 'Portrait'],
    description:
      'An early signature piece from 2020 set against a soothing amber-cream ground, where rhythmic black wave lines echo lace-like shoulder contours.',
    gridPlacement: 'offset-right',
    source: 'curated',
  },
  {
    id: 'mo-art-09',
    catalogNumber: 'MO. 2025.08',
    title: 'Elongated Visage in Magenta',
    category: 'physical',
    imageUrl: '/assets/artworks/mo_work_09.svg',
    medium: 'Acrylic & Marker on Framed Paper',
    artStyle: 'Modernist Mask Figuration',
    paintUsed: 'Quinacridone Magenta, Emerald Green, Crimson & Umber',
    dimensions: '60 x 95 cm',
    year: '2025',
    tags: ['Mask Study', 'Minimalist', 'Framed', 'Signed Mo'],
    description:
      'With sculptural economy of line, an elongated silhouette balances a bold magenta nasal bridge with asymmetrical red and green eyelids.',
    gridPlacement: 'center-overlap',
    source: 'curated',
  },
  {
    id: 'mo-art-10',
    catalogNumber: 'MO. 2025.09',
    title: 'The Architect of Line (Mo 25)',
    category: 'digital',
    imageUrl: '/assets/artworks/mo_work_10.svg',
    medium: 'Digital Monoprint on Cotton Rag',
    artStyle: 'Stark Graphic Portraiture',
    paintUsed: 'Pure Pitch Black Ink Brush on Crisp White Canvas',
    dimensions: '3000 x 3900 px',
    year: '2025',
    tags: ['Monochrome', 'Self-Referential', 'Minimalism', 'Mo 25'],
    description:
      'A crisp high-contrast study of the artist in a tailored shirt with drafting pencils tucked into the breast pocket, celebrating pure contour.',
    gridPlacement: 'wide-left',
    source: 'curated',
  },
  {
    id: 'mo-art-11',
    catalogNumber: 'MO. 2025.10',
    title: 'Equilibrium in Stripes',
    category: 'physical',
    imageUrl: '/assets/artworks/mo_work_11.svg',
    medium: 'Gouache & Ink on Cold-Press Paper',
    artStyle: 'Linear Surrealism',
    paintUsed: 'Ultramarine Blue, Viridian Green, Carmine Red & Black Ink',
    dimensions: '65 x 90 cm',
    year: '2025',
    tags: ['Stripes', 'Surrealism', 'Mask Study', 'Equilibrium'],
    description:
      'Offset eyes and dual cheek inscriptions float within a stark white mask silhouette, anchored by a bisected cobalt-and-emerald neck against horizontal rules.',
    gridPlacement: 'tall-right',
    source: 'curated',
  },
  {
    id: 'mo-art-12',
    catalogNumber: 'MO. 2025.11',
    title: 'Chapter 7: Long Time on a Ghost',
    category: 'digital',
    imageUrl: '/assets/artworks/mo_work_12.svg',
    medium: 'Digital Visual Poetry & Editorial Print',
    artStyle: 'Conceptual Narrative Line Art',
    paintUsed: 'Monoline Ink & Hand-Lettered Typography',
    dimensions: '2800 x 4500 px',
    year: '2025',
    tags: ['Visual Poetry', 'Narrative', 'Chapter VII', 'Monochrome'],
    description:
      'Blending poetic text with weightless iconography, a fractured heart balloon drifts among stylized clouds above the confession: "I do not want to remember it."',
    gridPlacement: 'wide-overlap',
    source: 'curated',
  },
  {
    id: 'mo-art-13',
    catalogNumber: 'MO. 2025.12',
    title: 'Unapologetic Boundaries',
    category: 'digital',
    imageUrl: '/assets/artworks/mo_work_13.svg',
    medium: 'Digital Stipple & Calligraphic Ink',
    artStyle: 'Contemporary Expressive Line',
    paintUsed: 'Stipple Pointillism Brush, Jet Ink & Crimson Offset Type',
    dimensions: '3000 x 4200 px',
    year: '2025',
    tags: ['Expressive', 'Pointillism', 'Statement', 'Portrait'],
    description:
      'Fine pointillist stippling across the crown meets razor-sharp winged liner, sculptural pendulum earrings, and an unapologetic vertical statement.',
    gridPlacement: 'featured-left',
    source: 'curated',
  },
];
