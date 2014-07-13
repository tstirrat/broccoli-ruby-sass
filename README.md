# broccoli-ruby-sass

The broccoli-ruby-sass plugin compiles `.scss` and `.sass` files with
[sass](https://github.com/sass/sass).

## Installation

```bash
npm install --save-dev broccoli-ruby-sass
```

## Usage

```js
var compileSass = require('broccoli-ruby-sass');

var outputTree = compileSass(inputTrees, inputFile, outputFile, options);
```

* **`inputTrees`**: An array of trees that act as the include paths for
  libsass. If you have a single tree, pass `[tree]`.

* **`inputFile`**: Relative path of the main `.scss` or `.sass` file to compile.
  This file must exist in one of the `inputTrees`.

* **`outputFile`**: Relative path of the output CSS file.

* **`options`**: A hash of options for sass. Supported options are
  `imagePath`, `outputStyle`, `sourceComments`, `sourceMap`, `bundleExec`,
  `loadPath`, and `require`.

### Example

```js
var appCss = compileSass(sourceTrees, 'myapp/app.scss', 'assets/app.css');
