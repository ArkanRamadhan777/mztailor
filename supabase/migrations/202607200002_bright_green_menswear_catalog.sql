-- Refresh the initial portfolio examples for the bright-green menswear direction.
update public.portfolios set
  title = 'Kemeja Hijau Modern',
  description = 'Potongan bersih dengan ukuran yang presisi.',
  image_url = '/images/menswear-hero.png',
  category = 'Kemeja Pria'
where sort_order = 1;

update public.portfolios set
  title = 'Setelan Linen Pria',
  description = 'Ringan, rapi, dan nyaman untuk acara istimewa.',
  image_url = '/images/menswear-suit.png',
  category = 'Setelan Pria'
where sort_order = 2;

update public.portfolios set
  title = 'Baju Koko Modern',
  description = 'Detail bordir lembut dengan siluet kontemporer.',
  image_url = '/images/menswear-koko.png',
  category = 'Busana Pria'
where sort_order = 3;
