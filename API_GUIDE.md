# ReadMore API guide

## Start the server

1. Copy .env.example to .env.
2. Put your MongoDB connection string in MONGODB_URI in .env. Do not share or commit that value.
3. In the VS Code terminal, run npm install once, then npm run dev.
4. Open http://localhost:3000/ to see the health-check response.

The server connects to MongoDB before it starts listening. If the connection fails, it prints an error and exits.

## How the files fit together

- server.js loads private settings, connects to MongoDB, and starts the server.
- app.js sets up JSON request bodies, the health check, routes, and error handling.
- models describe Author and Book documents. The Book author field stores an Author id.
- routes map URLs to controller functions.
- controllers perform database work and apply the assignment's rules.
- utils/validators.js contains shared id, price/year, and duplicate-title checks.

## Endpoints

| Method | URL | Purpose |
| --- | --- | --- |
| GET | / | Check that the API is running |
| POST | /authors | Create an author |
| GET | /authors | List authors |
| GET | /authors/:id | Get one author |
| PUT | /authors/:id | Update an author |
| DELETE | /authors/:id | Delete an author if they have no books |
| GET | /authors/:id/books | List an author's books |
| GET | /authors/:id/stats | Get book statistics for an author |
| POST | /books | Create a book for an existing author |
| GET | /books | List, filter, sort, and paginate books |
| GET | /books/:id | Get one book with its author details |
| PUT | /books/:id | Update a book |
| DELETE | /books/:id | Delete a book |

## Book list examples

- /books?genre=Thriller
- /books?minPrice=10
- /books?minPrice=10&maxPrice=30
- /books?search=sea
- /books?genre=Thriller&minPrice=10&maxPrice=30&sort=price&order=asc
- /books?author=AUTHOR_ID&page=1&limit=5

The list response has page, limit, total, and results. If no filters are supplied, all books are eligible and the first page is returned.

## Status choices

- 201: a new author or book was created.
- 200: a request succeeded.
- 400: an id or query value is malformed, or a book names an author that does not exist.
- 404: an author, book, or route was not found.
- 409: a title repeats for the same author, or an author still has books and cannot be deleted.
- 422: request fields contain an invalid price/year or fail model validation.

## Author deletion policy

This implementation blocks deleting an author while books point to them. It preserves the bookstore's book records and avoids leaving orphaned books. The downside is that the author cannot be deleted until those books are moved or removed. If the books represented sold inventory, a production store might instead keep historical records and mark an author inactive.

## Empty author statistics

For an author with no books, bookCount is 0, averagePrice is 0, and cheapestBook and mostExpensiveBook are null. This makes the absence of a book title explicit.

## Video walkthrough checklist

- Show the models and explain that a book stores an ObjectId reference to an author.
- Show the routes and controllers, then run the API.
- Demonstrate the health check and every author and book CRUD route.
- Demonstrate populated author details on a book response and the author books route.
- Show a made-up author id rejected with 400.
- Show a same-author duplicate title rejected with 409, including different letter case.
- Show zero/negative price and an invalid year rejected with 422.
- Try deleting an author with books and explain the block policy and its downside.
- Combine at least two book filters in one request.
- Demonstrate author statistics, including an author with no books.
- Show page and limit in the book-list response.
