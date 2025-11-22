# kNOw-tube

You can run in dev, with: `docker compose up --build`
- hot reloading is on

If you install new dependencies, then need to rerun: 
1. `docker compose down`
2. `docker compose up --build`

To use the extension in Chrome:
1. Go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `kNOwtube-chrome-plugin` folder
5. The extension should now be loaded and ready to use!
6. Use together client for the LLMs

-- 
## Example for together

``` 
response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "user", "content": prompt},
        ],
        temperature=temperature,
        # max_tokens=max_output_tokens,
    )
```

