import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Alert, Box, Button } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 2 }}>
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={() => window.location.reload()}>
                RELOAD PAGE
              </Button>
            }
          >
            {this.state.error?.message || 'An unexpected error occurred'}
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
} 