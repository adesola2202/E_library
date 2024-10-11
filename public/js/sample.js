    // Fetch data from your server endpoint
    fetch('/sample')
      .then(response => response.json())
      .then(data => {
        const container = document.getElementById('book-container');

        // Iterate over each book and create HTML structure for it
        data.books.forEach(book => {
          const bookCard = document.createElement('div');
          bookCard.classList.add('book-card');

          const bookTitle = document.createElement('h2');
          bookTitle.classList.add('book-title');
          bookTitle.textContent = book.title;

          const bookAuthor = document.createElement('p');
          bookAuthor.classList.add('book-author');
          bookAuthor.textContent = book.authors ? book.authors[0].name : 'Unknown Author';

          const bookImage = document.createElement('img');
          // Checking if cover image exists, otherwise set default image
          bookImage.src = book.cover ? https://covers.openlibrary.org/b/id/${book.cover}-L.jpg : 'default-image.jpg';

          // Append each element to the book card
          bookCard.appendChild(bookImage);
          bookCard.appendChild(bookTitle);
          bookCard.appendChild(bookAuthor);

          // Add book card to container
          container.appendChild(bookCard);
        });
      })
      .catch(error => console.error('Error fetching books:', error));