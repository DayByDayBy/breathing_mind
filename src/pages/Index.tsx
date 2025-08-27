import MeditationToneGenerator from '@/components/MeditationToneGenerator';

const Index = () => {
  console.log('Index component rendering...');
  
  try {
    return <MeditationToneGenerator />;
  } catch (error) {
    console.error('Error in Index component:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Loading Error</h1>
          <p className="text-muted-foreground">Check console for details</p>
        </div>
      </div>
    );
  }
};

export default Index;
