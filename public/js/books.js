const Book = {
    addBook: async (db, bookData) => {
      const existingBook = await db.collection('books').findOne({ googleBookId: bookData.googleBookId });
      if (!existingBook) {
        return await db.collection('books').insertOne(bookData);
      }
      return existingBook; // Book already exists
    },
  
    getBooks: async (db, query) => {
      return await db.collection('books').find(query).toArray();
    }
  };
  
  module.exports = Book;