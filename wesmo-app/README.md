# WESMO Website

This website is a React Web App. Running the app can be completed in the following ways.

## Available Scripts

In the project directory {wesmo-app}, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

### Deployment

The production build is deployed to the `wesmo-site-prod` S3 bucket, which serves the live site at https://wesmo.co.nz via CloudFront (AWS's CDN).

After running `npm run build`, upload the `build` folder to the root of the `wesmo-site-prod` bucket. Because CloudFront caches content at edge locations, changes may not appear immediately — to force an update, create a CloudFront invalidation (`/*`) via the AWS Console (CloudFront → your distribution → Invalidations → Create Invalidation):

> Note: this site was previously hosted on an EC2 instance; it now runs on S3 + CloudFront.
