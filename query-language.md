# Example queries

## Find all people at least 18 years old

```jack
let data = [
  {info: {age: ...}, ...}
  ...
]

match data with $[*][?(@.age >= 18)]
```

**TODO** Think about this a *lot* more.