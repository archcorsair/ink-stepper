# Validation

You often need to ensure data is valid before allowing the user to proceed to the next step. `ink-stepper` supports both synchronous and asynchronous validation via the `canProceed` prop on `<Step>`.

## Synchronous Validation

Pass a boolean to `canProceed`. If `false`, the "Enter" key (and `goNext()`) will be ignored.

```tsx
function NameStep() {
  const [name, setName] = useState('');

  return (
    <Step name="Name" canProceed={name.length > 0}>
      <Text>Enter your name:</Text>
      <TextInput value={name} onChange={setName} />
      {name.length === 0 && <Text color="red">Name is required</Text>}
    </Step>
  );
}
```

## Asynchronous Validation

You can also pass a function that returns a `boolean` or `Promise<boolean>`. This is useful for server-side checks or simulating API calls.

```tsx
const checkServer = async () => {
  // simulate delay
  await new Promise(r => setTimeout(r, 1000));
  return true; 
};

<Step name="Server Check" canProceed={checkServer}>
  {({ isValidating }) => (
    <Box>
      <Text>Checking server status...</Text>
      {isValidating && <Spinner />}
    </Box>
  )}
</Step>
```

When validation is in progress:
1. `isValidating` (from context) becomes `true`.
2. Navigation is locked.
3. If the promise resolves to `true`, the stepper advances.
4. If `false`, it stays on the current step.
