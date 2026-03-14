import { ScoreCanvas } from './components/ScoreCanvas';
import { ErrorBoundary } from './ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ScoreCanvas />
    </ErrorBoundary>
  );
}

export default App;
