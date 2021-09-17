## Release Process

1. Run `npm run build` to compile the TypeScript source code in to JS (output will be in `lib/index.js`, ignored by git).
2. Run `npm run package` to compile the JS from step 1 into a single file (output will be in the dist folder).
3. Commit the changes to the dist folder from step 2.
4. Push a tag with the new version number to GitHub.
