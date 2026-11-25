/* photos.js - compresses photos in the browser (max 3, each well under 500 KB). */
const Photos = {
  MAX_FILES: 3,
  MAX_SIDE: 800,
  compress(files) {
    return Promise.all(
      [...files].slice(0, this.MAX_FILES).map(
        (file) =>
          new Promise((done) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
              const k = Math.min(1, this.MAX_SIDE / Math.max(img.width, img.height));
              const c = document.createElement('canvas');
              c.width = img.width * k;
              c.height = img.height * k;
              c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
              URL.revokeObjectURL(url);
              done(c.toDataURL('image/jpeg', 0.6));
            };
            img.onerror = () => done(null);
            img.src = url;
          })
      )
    ).then((list) => list.filter(Boolean));
  }
};