export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t w-full h-16 bg-background z-40">
      <div className="container h-full flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Built with ❤️ by RMS Team
        </p>
        <p className="text-sm text-muted-foreground">
          {new Date().getFullYear()} RMS. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
