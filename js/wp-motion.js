/* Scoped adapters for WooCommerce presentation; no request/form/payment handlers. */
(() => {
 'use strict';
 const motion=window.YZA?.motion, $=window.jQuery;
 if (!motion || !$) return;
 const refresh=()=>{
   $.fx.off=motion.preference.matches;
   if ($.blockUI?.defaults) {
     $.blockUI.defaults.fadeIn=motion.duration('modal-enter');
     $.blockUI.defaults.fadeOut=motion.duration('modal-exit');
   }
 };
 refresh(); motion.preference.addEventListener('change',refresh);
 // WooCommerce help descriptions retain their show/hide state without height tweening.
 ['slideDown','slideUp'].forEach(name=>{
   const original=$.fn[name];
   $.fn[name]=function(...args) {
     if (!this.length || !this.toArray().every(el=>el.matches('.woocommerce-input-wrapper span.description'))) return original.apply(this,args);
     this.stop(true,true)[name==='slideDown'?'show':'hide']();
     if(name==='slideDown')this.each(function(){motion.enter(this,{fast:true,fadeOnly:true});});
     const done=args.find(value=>typeof value==='function');
     if(done)this.each(function(){done.call(this);});
     return this;
   };
 });
 // Install after WooCommerce's ready callback, retaining its notice destination.
 $(function(){
   $.scroll_to_notices=notices=>{
     if(!notices?.length)return;
     const top=notices[0].getBoundingClientRect().top+scrollY-100;
     window.scrollTo({top,behavior:motion.preference.matches?'instant':'smooth'});
   };
 });
})();
