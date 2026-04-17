const fs = require('fs');

const nav = {
  links: [
    {label_ka:'მთავარი',label_en:'Home',href:'index.html',children:[]},
    {label_ka:'ავეჯი',label_en:'Furniture',href:'main-furniture.html',children:[
      {label_ka:'გარე ავეჯი',label_en:'Outdoor Furniture',href:'main-furniture.html'},
      {label_ka:'საოფისე ავეჯი',label_en:'Office Furniture',href:'office-furniture.html'},
      {label_ka:'ლოფტ კოლექცია',label_en:'Loft Collection',href:'loft-collection.html'},
      {label_ka:'ხის ავეჯი',label_en:'Wood Furniture',href:'main-furniture.html'},
      {label_ka:'ლითონის ავეჯი',label_en:'Metal Furniture',href:'main-furniture.html'}
    ]},
    {label_ka:'გარე ავეჯი',label_en:'Outdoor',href:'main-furniture.html',children:[]},
    {label_ka:'საოფისე',label_en:'Office',href:'office-furniture.html',children:[]},
    {label_ka:'განათება',label_en:'Lighting',href:'lighting.html',children:[]},
    {label_ka:'დეკორაცია',label_en:'Decoration',href:'decoration.html',children:[]},
    {label_ka:'კონტაქტი',label_en:'Contact',href:'#contact',children:[]}
  ]
};

const hero = {
  tag_ka:'ხის & ლითონის ხელობა',tag_en:'Wood & Metal Craft',
  title_ka:'შექმენით თქვენი იდეალური სივრცე',title_en:'Create Your Ideal Space',
  desc_ka:'ინდუსტრიული დიზაინი • ხელნაკეთი ავეჯი • ბუნებრივი მასალები',
  desc_en:'Industrial Design \u2022 Handcrafted Furniture \u2022 Natural Materials',
  btn1_ka:'კოლექციის ნახვა',btn1_en:'View Collection',
  btn2_ka:'პროდუქციის ნახვა',btn2_en:'Browse Products',
  bg_image:'/images/cover.webp'
};

const categories = {
  tag_ka:'კატეგორიები',tag_en:'Categories',
  title_ka:'აირჩიეთ თქვენი სტილი',title_en:'Choose Your Style',
  desc_ka:'ხის სითბო და ლითონის სიმტკიცე — ყველა სივრცისთვის',
  desc_en:'Wood warmth and metal strength — for every space',
  cards:[
    {name_ka:'გარე ავეჯი',name_en:'Outdoor Furniture',sub_ka:'ტერასა, ბაღი & აივანი',sub_en:'Terrace, Garden & Balcony',link:'main-furniture.html',image:'/images/cover.webp',alt:'გარე ავეჯი — ტერასა და ბაღი',large:true},
    {name_ka:'საოფისე ავეჯი',name_en:'Office Furniture',sub_ka:'მაგიდები & სკამები',sub_en:'Desks & Chairs',link:'office-furniture.html',image:'/images/cover2.webp',alt:'Loft Line საოფისე ავეჯის კოლექცია',large:false},
    {name_ka:'განათება',name_en:'Lighting',sub_ka:'ინდუსტრიული ნათურები',sub_en:'Industrial Lights',link:'lighting.html',image:'/images/cover4.webp',alt:'Loft Line ლოფტ სტილის განათება',large:false},
    {name_ka:'დეკორაცია',name_en:'Decoration',sub_ka:'აქსესუარები & სეზონური',sub_en:'Accessories & Seasonal',link:'decoration.html',image:'/images/cover5.webp',alt:'Loft Line ლოფტ სტილის დეკორაცია',large:false},
    {name_ka:'ლოფტ სტილი',name_en:'Loft Style',sub_ka:'ინდუსტრიული ხასიათი',sub_en:'Industrial Character',link:'loft-collection.html',image:'/images/cover3.webp',alt:'ლოფტ სტილის კოლექცია',large:false}
  ]
};

const about = {
  tag_ka:'ჩვენ შესახებ',tag_en:'About Us',
  title_ka:'ხელობა და ხარისხი',title_en:'Craft & Quality',
  para1_ka:'Loft Line-ში ჩვენ ვქმნით ავეჯს, რომელიც აერთიანებს ხის ბუნებრივ სითბოს და ლითონის ინდუსტრიულ ხასიათს. ყოველი ნაწარმი იქმნება ხელით, ქართველი ოსტატების მიერ.',
  para1_en:'At Loft Line, we create furniture that combines the natural warmth of wood with the industrial character of metal. Every piece is crafted by hand by Georgian artisans.',
  para2_ka:'ჩვენი კოლექციები მოიცავს მთავარ ავეჯს, საოფისე ავეჯს, ლოფტ სტილის უნიკალურ ნამუშევრებს, ასევე განათებასა და დეკორაციას.',
  para2_en:'Our collections include outdoor furniture, office furniture and unique loft-style pieces. Lighting, decoration and seasonal products are also coming soon.',
  btn_ka:'დაგვიკავშირდით',btn_en:'Contact Us',
  image:'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=800&q=80'
};

const usp = {
  cards:[
    {title_ka:'ხარისხის გარანტია',title_en:'Quality Guarantee',text_ka:'1 წლიანი გარანტია ყველა ხის ავეჯზე',text_en:'5-year warranty on all wood furniture',icon:`<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`},
    {title_ka:'უფასო მიტანა',title_en:'Free Delivery',text_ka:'₾200+ შეკვეთაზე მთელი საქართველოს მასშტაბით',text_en:'On orders ₾200+ across all of Georgia',icon:`<rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>`},
    {title_ka:'ხელნაკეთი',title_en:'Handcrafted',text_ka:'ყველა ნაწარმი იქმნება ხელით, ინდივიდუალურად',text_en:'Every piece is crafted by hand, individually',icon:`<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>`},
    {title_ka:'ქართული წარმოება',title_en:'Made in Georgia',text_ka:'ადგილობრივი ოსტატების მიერ შექმნილი',text_en:'Created by local Georgian craftsmen',icon:`<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>`}
  ]
};

const newsletter = {
  title_ka:'გამოიწერეთ სიახლეები',title_en:'Subscribe to News',
  text_ka:'მიიღეთ ინფორმაცია ახალი კოლექციების, ფასდაკლებებისა და სეზონური შეთავაზებების შესახებ.',
  text_en:'Get information about new collections, discounts and seasonal offers.',
  placeholder_ka:'თქვენი ელ-ფოსტა',placeholder_en:'Your email address',
  btn_ka:'გამოწერა',btn_en:'Subscribe'
};

const writes = {
  'content/settings/navigation.json': nav,
  'content/pages/homepage-hero.json': hero,
  'content/pages/homepage-categories.json': categories,
  'content/pages/homepage-about.json': about,
  'content/pages/homepage-usp.json': usp,
  'content/pages/homepage-newsletter.json': newsletter
};

Object.entries(writes).forEach(([path, obj]) => {
  fs.writeFileSync(path, JSON.stringify(obj, null, 2), 'utf8');
  console.log('Written:', path);
});
console.log('Done');
