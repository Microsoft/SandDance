// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
export const embedHtml = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SandDance</title>
    <link rel="stylesheet" type="text/css"
        href="https://unpkg.com/@msrvida/sanddance-embed@1/dist/css/sanddance-embed.css" />
    <link rel="stylesheet" type="text/css"
        href="https://unpkg.com/@msrvida/sanddance-explorer@1/dist/css/sanddance-explorer.css" />
</head>

<body>
    <script src="https://unpkg.com/react@16/umd/react.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/deck.gl@6/deckgl.min.js"></script>
    <script src="https://unpkg.com/vega@4/build/vega.min.js"></script>
    <script src="https://unpkg.com/office-ui-fabric-react@6.204.4/dist/office-ui-fabric-react.js"></script>
    <script src="https://unpkg.com/@msrvida/sanddance-explorer@1/dist/umd/sanddance-explorer.js"></script>
    <script src="https://unpkg.com/@msrvida/sanddance-embed@1/dist/umd/sanddance-embed.js"></script>

    <div id="app"></div>

    <!--EMBED-->

</body>

</html>`;