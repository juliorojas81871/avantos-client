import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import FormGraph from './components/FormGraph';
import ErrorBoundary from './components/ErrorBoundary';

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ErrorBoundary>
        <FormGraph />
        </ErrorBoundary>
      </Container>
    </ThemeProvider>
  );
}

export default App;
