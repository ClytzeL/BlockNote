import React from "react";

const template = () => (
  <html lang="en">
    <head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>title</title>
    </head>
    <body>
      <div id="root"></div>
      <script type="module" src="./main.tsx"></script>
    </body>
  </html>
);

export default template;
