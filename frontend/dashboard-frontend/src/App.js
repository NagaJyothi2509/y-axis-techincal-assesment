import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, Redirect, Route, Switch } from "react-router-dom";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Divider,
  Grid,
  Link,
  Stack,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme
} from "@mui/material";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import StoreRoundedIcon from "@mui/icons-material/StoreRounded";

const API = process.env.REACT_APP_DASHBOARD_API || "http://dashboard.myplatform.local:5001";
const LOGIN = process.env.REACT_APP_LOGIN_URL || "http://app.myplatform.local:3001/login";
const AUTH_API = process.env.REACT_APP_AUTH_API || "http://app.myplatform.local:4000";
const STORE_URL = process.env.REACT_APP_STORE_URL || "http://store.myplatform.local:3003";
const MAIN_APP_HOME_URL = process.env.REACT_APP_MAIN_APP_HOME_URL || "http://app.myplatform.local:3001/home";
const SESSION_CHECK_INTERVAL_MS = 5000;

const theme = createTheme({
  palette: {
    primary: { main: "#0f172a" },
    secondary: { main: "#0ea5e9" },
    background: { default: "#eef2ff" }
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "Manrope, system-ui, sans-serif",
    h3: { fontWeight: 800 },
    h5: { fontWeight: 700 }
  }
});

function redirectToLogin() {
  globalThis.location.href = LOGIN;
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    credentials: "include",
    ...options
  });
  if (response.status === 401) {
    redirectToLogin();
    throw new Error("Unauthorized");
  }
  return response;
}

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const response = await apiFetch("/api/dashboard/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (_error) {
        setUser(null);
      }
      setLoading(false);
    }

    check();

    const intervalId = globalThis.setInterval(check, SESSION_CHECK_INTERVAL_MS);
    globalThis.addEventListener("focus", check);

    return () => {
      globalThis.clearInterval(intervalId);
      globalThis.removeEventListener("focus", check);
    };
  }, []);

  return { user, loading };
}

function Layout({ user, children, onLogout }) {
  return (
    <Box className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#bfdbfe,_#eef2ff_40%,_#ffffff)]">
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: "1px solid #dbeafe" }}>
        <Toolbar>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1 }}>
            <Avatar sx={{ bgcolor: "#0ea5e9" }}>
              <QueryStatsRoundedIcon />
            </Avatar>
            <Box>
              <Typography fontWeight={800}>Analytics Dashboard</Typography>
              <Typography variant="caption" color="text.secondary">Welcome, {user.name}</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button component={RouterLink} to="/overview">Overview</Button>
            <Button component={RouterLink} to="/settings">Settings</Button>
            <Button href={STORE_URL} startIcon={<StoreRoundedIcon />}>Store</Button>
            <Button href={MAIN_APP_HOME_URL}>Main App</Button>
            <Button color="error" variant="outlined" onClick={onLogout} startIcon={<LogoutRoundedIcon />}>
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}

function Overview({ user, onLogout }) {
  const [data, setData] = useState({ cards: [], activity: [] });

  useEffect(() => {
    async function load() {
      try {
        const response = await apiFetch("/api/dashboard/overview");
        const payload = await response.json();
        setData(payload);
      } catch (_error) {
        setData({ cards: [], activity: [] });
      }
    }
    load();
  }, []);

  return (
    <Layout user={user} onLogout={onLogout}>
      <Stack spacing={3}>
        <Card sx={{ border: "1px solid #bfdbfe" }}>
          <CardContent>
            <Typography variant="h3">Performance Snapshot</Typography>
            <Typography color="text.secondary">Everything important at a glance for quick decisions.</Typography>
          </CardContent>
        </Card>

        <Grid container spacing={2}>
          {data.cards.map((card) => (
            <Grid item xs={12} md={4} key={card.label}>
              <Card sx={{ border: "1px solid #dbeafe", height: "100%" }}>
                <CardContent>
                  <Stack spacing={1}>
                    <Chip label={card.label} sx={{ width: "fit-content", bgcolor: "#e0f2fe" }} />
                    <Typography variant="h4">{card.value}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card sx={{ border: "1px solid #c7d2fe" }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 1 }}>Activity Feed</Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.2}>
              {data.activity.map((item) => (
                <Alert key={item} severity="info" sx={{ bgcolor: "#f0f9ff" }}>
                  {item}
                </Alert>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Layout>
  );
}

function Settings({ user, onLogout }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await apiFetch("/api/dashboard/settings");
        const payload = await response.json();
        setSettings(payload);
      } catch (_error) {
        setSettings(null);
      }
    }
    load();
  }, []);

  return (
    <Layout user={user} onLogout={onLogout}>
      <Card sx={{ border: "1px solid #dbeafe" }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <SettingsRoundedIcon color="secondary" />
              <Typography variant="h5">Settings</Typography>
            </Stack>
            {settings ? (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary">Name</Typography>
                      <Typography variant="h6">{settings.profile.name}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary">Email</Typography>
                      <Typography variant="h6">{settings.profile.email}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary">Theme</Typography>
                      <Typography variant="h6">{settings.preferences.theme}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary">Notifications</Typography>
                      <Typography variant="h6">{settings.preferences.notifications ? "Enabled" : "Disabled"}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Alert severity="warning">Unable to load settings.</Alert>
            )}
            <Typography color="text.secondary">
              Need to move around? <Link href={STORE_URL}>Go to Store</Link> or <Link href={MAIN_APP_HOME_URL}>back to Main App</Link>.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Layout>
  );
}

function App() {
  const { user, loading } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const loadingView = useMemo(
    () => (
      <Box sx={{ p: 5 }}>
        <Typography variant="h5">Loading dashboard...</Typography>
      </Box>
    ),
    []
  );

  async function logout() {
    setLoggingOut(true);
    await fetch(`${AUTH_API}/api/auth/logout`, {
      method: "POST",
      credentials: "include"
    });
    redirectToLogin();
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {loading ? loadingView : null}
      {!loading ? (
        loggingOut ? (
          <Box sx={{ p: 5 }}>
            <Typography variant="h5">Logging out...</Typography>
          </Box>
        ) : user ? (
          <Switch>
            <Route path="/overview" render={() => <Overview user={user} onLogout={logout} />} />
            <Route path="/settings" render={() => <Settings user={user} onLogout={logout} />} />
            <Route path="/" render={() => <Redirect to="/overview" />} />
          </Switch>
        ) : (
          <Redirect to="/" />
        )
      ) : null}
    </ThemeProvider>
  );
}

export default App;
