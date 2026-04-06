import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function SiteFooter() {
  return (
    <Box component="footer" sx={{ borderTop: "1px solid", borderColor: "divider", py: 4, mt: 6 }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            TableStory Restaurant
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Crafted with Next.js + MUI
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
