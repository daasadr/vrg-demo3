# GitHub Pages Deployment Setup

This project has been configured for automatic deployment to GitHub Pages using GitHub Actions CI/CD.

## What's Been Set Up

### 1. GitHub Actions Workflow
- Created `.github/workflows/deploy.yml`
- Automatically builds and deploys to GitHub Pages on every push to main branch
- Uses Node.js 18 with npm caching for faster builds
- Properly configured with GitHub Pages permissions

### 2. Package.json Updates
- Added `homepage` field for GitHub Pages (needs your GitHub username)
- Fixed merge conflict in description field
- Added `@craco/craco` dependency to support webpack aliases
- Updated build scripts to use craco instead of react-scripts

## Next Steps

### 1. Update Homepage URL
Replace `YOUR_GITHUB_USERNAME` in `package.json` with your actual GitHub username:
```json
"homepage": "https://YOUR_GITHUB_USERNAME.github.io/vrg-demo3"
```

### 2. Install Dependencies
Run the following command to install the new craco dependency:
```bash
npm install
```

### 3. Enable GitHub Pages
1. Go to your repository settings on GitHub
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select "GitHub Actions"
4. Save the settings

### 4. Push Changes
Commit and push all changes to trigger the first deployment:
```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

## Build Configuration

The project now uses CRACO (Create React App Configuration Override) which:
- Supports the webpack aliases defined in `craco.config.js`
- Maintains compatibility with Create React App
- Allows for future customization of the build process

## Deployment Process

1. **Trigger**: Push to main branch or create pull request
2. **Build**: GitHub Actions runs `npm ci` and `npm run build`
3. **Deploy**: Built files from `./build` directory are deployed to GitHub Pages
4. **Access**: Your app will be available at `https://YOUR_GITHUB_USERNAME.github.io/vrg-demo3`

## Troubleshooting

- **Build fails**: Check the Actions tab in your GitHub repository for error details
- **Page not loading**: Ensure the homepage URL in package.json matches your repository name
- **Assets not loading**: Verify all asset paths are relative (no leading slash)

The deployment typically takes 2-3 minutes after pushing to main branch. 