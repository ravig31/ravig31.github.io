---
title: Subshells
tags: [programming, shells]
---


In context of quick access to neovim config

### Command

`(cd ${HOME}/dotfiles/.config/nvim && vim)`
### How It Works

- `(` and `)`: These parentheses start and end a subshell.
    
- `cd ${HOME}/dotfiles/.config/nvim`: This changes the directory **only** within the subshell.
    
- `&&`: This is a logical AND operator. It ensures that the `vim` command will only run if the `cd` command was successful.
    
- `vim`: This launches `vim` from within the new directory.


