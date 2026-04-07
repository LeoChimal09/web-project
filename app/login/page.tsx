import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import GitHubSignInButton from "@/components/auth/GitHubSignInButton";

export default function LoginPage() {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 }, textAlign: "center" }}>
      <Stack spacing={3}>
        <Typography variant="overline" color="secondary.main">
          Admin Sign In
        </Typography>
        <Typography variant="h4">Sign in to access the admin area</Typography>
        <Typography color="text.secondary">
          Only approved GitHub accounts listed in the admin allowlist can access staff routes.
        </Typography>
        <Stack alignItems="center">
          <GitHubSignInButton />
        </Stack>
      </Stack>
    </Container>
  );
}
