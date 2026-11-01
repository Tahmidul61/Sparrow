// ═══════════════════════════════════════════════════════════════
// data.js — All static data: cakes, flavours, allergens, business
// This file NEVER touches the DOM. Safe to edit independently.
// ═══════════════════════════════════════════════════════════════

var LOGO_B64 = ''; // filled by app.js from website.html inline

var DEFAULT_CAKES = [
  {id:'cake-1',num:1,name:'Chocolate Sponge Cake',nameEn:'Chocolate Sponge Cake',
   desc:'Bolo esponja de chocolate húmido com recheio cremoso.',
   descEn:'Moist chocolate sponge with creamy filling.',
   price:19.99,category:'sponge',badge:'popular',photos:[],code:'BP-001',available:true,minSize:'1.0'},
  {id:'cake-2',num:2,name:'Vanilla Sponge Cake',nameEn:'Vanilla Sponge Cake',
   desc:'Bolo esponja de baunilha leve e fofo.',
   descEn:'Light and fluffy vanilla sponge cake.',
   price:19.99,category:'sponge',badge:'new',photos:[],code:'BP-002',available:true,minSize:'1.0'},
  {id:'cake-3',num:3,name:'Normal Egg Sponge',nameEn:'Normal Egg Sponge',
   desc:'Bolo esponja clássico com ovos frescos.',
   descEn:'Classic egg sponge with fresh eggs.',
   price:19.99,category:'sponge',badge:'',photos:[],code:'BP-003',available:true,minSize:'1.0'},
  {id:'cake-4',num:4,name:'Design Especial 4',nameEn:'Special Design 4',
   desc:'Design personalizado disponível em breve.',
   descEn:'Custom design coming soon.',
   price:19.99,category:'special',badge:'',photos:[],code:'BP-004',available:true,minSize:'1.0'},
  {id:'cake-5',num:5,name:'Design Especial 5',nameEn:'Special Design 5',
   desc:'Design personalizado disponível em breve.',
   descEn:'Custom design coming soon.',
   price:19.99,category:'special',badge:'',photos:[],code:'BP-005',available:true,minSize:'1.0'}
];

var DEFAULT_FLAVOURS = [
  {value:'morango',    name:'Strawberry',      emoji:'\uD83C\uDF53'},
  {value:'chocolate',  name:'Chocolate',       emoji:'\uD83C\uDF6B'},
  {value:'chocolate-branco', name:'White Chocolate', emoji:'\uD83E\uDD0D'},
  {value:'limao',      name:'Lemon',           emoji:'\uD83C\uDF4B'},
  {value:'limao-verde',name:'Lime',            emoji:'\uD83C\uDF4B'},
  {value:'laranja',    name:'Orange',          emoji:'\uD83C\uDF4A'},
  {value:'kiwi',       name:'Kiwi',            emoji:'\uD83E\uDD5D'},
  {value:'coco',       name:'Coconut',         emoji:'\uD83E\uDD65'},
  {value:'ananas',     name:'Pineapple',       emoji:'\uD83C\uDF4D'},
  {value:'cereja',     name:'Cherry',          emoji:'\uD83C\uDF52'},
  {value:'manga',      name:'Mango',           emoji:'\uD83E\uDD6D'},
  {value:'framboesa',  name:'Raspberry',       emoji:'\uD83C\uDF53'},
  {value:'caramel',    name:'Caramel',         emoji:'\uD83C\uDF6F'},
  {value:'frutos-vermelhos', name:'Red Fruits',emoji:'\uD83C\uDF53'}
];

var DEFAULT_ALLERGENS = [
  {name:'Gluten',     icon:'\uD83C\uDF3E', desc:'Wheat flour used in all sponge bases.'},
  {name:'Eggs',       icon:'\uD83E\uDD5A', desc:'Fresh eggs in all cake bases.'},
  {name:'Milk',       icon:'\uD83E\uDD5B', desc:'Butter and cream in fillings and frosting.'},
  {name:'Soy',        icon:'\uD83C\uDF31', desc:'Some chocolate products may contain soy.'},
  {name:'Nuts',       icon:'\uD83E\uDD5C', desc:'Some designs may contain nut traces.'},
  {name:'Sulphites',  icon:'\u26A0\uFE0F', desc:'Present in some fruit fillings.'}
];

var DEFAULT_ACCESSORIES = [
  {id:'acc-1',num:1,name:'Birthday Candles',nameEn:'Birthday Candles',
   desc:'Velas coloridas para aniversário.',descEn:'Colourful birthday candles.',
   price:2.99,category:'accessories',badge:'',photos:[],code:'AC-001',available:true},
  {id:'acc-2',num:2,name:'Cake Topper',nameEn:'Cake Topper',
   desc:'Topper personalizado para o seu bolo.',descEn:'Custom cake topper.',
   price:3.99,category:'accessories',badge:'',photos:[],code:'AC-002',available:true}
];

var DEFAULT_ABOUT_US = '<p>Bismi Treats is an artisan cake bakery based in Coimbra, Portugal.</p><p>We make fresh, custom cakes with premium ingredients — delivered to your door.</p><p><strong>Phone:</strong> +351 934 453 710<br><strong>Email:</strong> bismitreats.pt@gmail.com<br><strong>Address:</strong> Pra\u00E7a Mestre Pero, Coimbra, Portugal</p><p><strong>Hours:</strong> Mon\u2013Sun 8:00\u201320:00<br><strong>Free Delivery:</strong> Mon\u2013Fri 18:00\u201322:00, Sat\u2013Sun 8:00\u201322:00</p>';

var BIZ = {
  name: 'Bismi Treats',
  tagline: 'Luxury and taste in one bite',
  phone: '+351934453710',
  email: 'bismitreats.pt@gmail.com',
  instagram: '@bismitreats.pt',
  website: 'bismitreats.com',
  address: 'Pra\u00E7a Mestre Pero, Coimbra, Portugal',
  whatsapp: '351934453710',
  googleReviews: 'https://g.page/r/CS1eY1P4V0IxEBM/review',
  aboutUs: DEFAULT_ABOUT_US,
  heroImg: '',
  logoImg: '',
  buttonColor: ''
};

// Live data (overwritten by MongoDB on load)
var CAKES        = DEFAULT_CAKES.slice();
var FLAVOURS     = DEFAULT_FLAVOURS.slice();
var ALLERGENS    = DEFAULT_ALLERGENS.slice();
var ACCESSORIES  = DEFAULT_ACCESSORIES.slice();

// Size brackets (shared across catalogue + customer form)
var SIZE_BRACKETS = [
  {v:'1.0',max:'1.3',p:'7-8 people'},
  {v:'1.3',max:'1.6',p:'9-11 people'},
  {v:'1.6',max:'1.9',p:'12-14 people'},
  {v:'1.9',max:'2.2',p:'15-16 people'},
  {v:'2.2',max:'2.5',p:'17-18 people'},
  {v:'2.5',max:'2.8',p:'19-22 people'},
  {v:'2.8',max:'3.1',p:'23-25 people'},
  {v:'3.1',max:'3.4',p:'26-28 people'},
  {v:'3.4',max:'3.7',p:'29-32 people'},
  {v:'3.7',max:'4.0',p:'33-35 people'},
  {v:'4.0',max:'4.3',p:'36-38 people'},
  {v:'4.3',max:'4.6',p:'39-42 people'},
  {v:'4.6',max:'4.9',p:'43-46 people'},
  {v:'4.9',max:'5.2',p:'47-50 people'}
];

// Cake types (used in detail modal + customer form)
var CAKE_TYPES = [
  {id:'sponge-chocolate', name:'Chocolate Sponge', price:19.99},
  {id:'sponge-vanilla',   name:'Vanilla Sponge',   price:19.99},
  {id:'sponge-normal',    name:'Normal Egg Sponge', price:19.99}
];