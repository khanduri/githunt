> Chrome extension - Replaces new tab with trending github repositories

THIS IS A FORK OF THE [ORIGINAL PROJECT](https://github.com/kamranahmedse/githunt)

![Extension demo](http://g.recordit.co/h0y0JGCBQ9.gif)

## Installation

[manually install it](http://superuser.com/a/247654/6877)

Github API has rate limit applied in their API and although the extension implements the caching in order to make sure that the rate limit may not be crossed but however I would recommend you to set the API token in the extension in order to increase the quota.

Here is how you can do that

- Go to the [`Settings > Personal Access Tokens`](https://github.com/settings/tokens) of your github profile
- Click `Generate New Token` button. Give the token description and select the scope called `public_repo` under `repo` and click `Generate Token`.
- You will be presented with the generated token. Copy the token.
- Right click on the extension icon and click `Options`. Paste the API token in the given field and click save
