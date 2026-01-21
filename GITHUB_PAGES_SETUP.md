# GitHub Pages Setup

## Step 1: Enable GitHub Pages

1. Go to: https://github.com/mohammed054/compiler/settings/pages

2. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions**

3. Click **Save**

---

## Step 2: Trigger Deployment

After enabling, the GitHub Actions workflow will automatically deploy on the next push to main.

To trigger immediately:

```bash
git add .
git commit -m "Enable GitHub Pages deployment"
git push origin main
```

---

## Alternative: Use gh-pages Branch

If you prefer using a branch instead of GitHub Actions:

1. Go to: https://github.com/mohammed054/compiler/settings/pages

2. Under **Build and deployment**:
   - **Source**: Select **Deploy from a branch**
   - **Branch**: Select **gh-pages** / (root) / **Save**

3. Create the gh-pages branch:

```bash
git checkout --orphan gh-pages
git rm -rf .
cp -r dist/* .
git add .
git commit -m "Initial gh-pages deployment"
git push -u origin gh-pages
```

---

## Verification

After deployment, your site will be available at:
**https://mohammed054.github.io/compiler/**

(Replacing `mohammed054` with your GitHub username)
