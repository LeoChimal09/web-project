import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

export default function LoginPage() {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 }, textAlign: "center" }}>
      <Stack spacing={3}>
        <Typography variant="overline" color="secondary.main">
          Admin Sign In
        </Typography>
        <Typography variant="h4">Sign in to access the admin area</Typography>
        <Typography color="text.secondary">
          Navigate to the admin area to sign in with Google OAuth or email verification (if test mode is enabled).
        </Typography>
        <Stack alignItems="center" spacing={2}>
          <Button variant="contained" href="/admin">
            Go to Admin Area
          </Button>
          <Button variant="outlined" href="/">
            Back to Home
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
