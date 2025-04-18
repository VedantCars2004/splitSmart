import React, { useState, useEffect, Fragment } from 'react';
import {
  Typography, Card, CardContent, Grid, CircularProgress,
  List, ListItem, ListItemText, Divider, Box, Paper
} from '@mui/material';
import { balanceApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Balance {
  id: number;
  from_user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  to_user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  amount: number;
}

const BalanceList: React.FC = () => {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const response = await balanceApi.getBalances();
      
      // Debug logging
      console.log("Current user:", currentUser);
      console.log("Raw balances data:", response.data);
      
      // sanitize amount → number
      const sanitized = response.data.map((b: Balance) => ({
        ...b,
        amount: typeof b.amount === 'string'
          ? parseFloat(b.amount)
          : b.amount
      }));
      
      setBalances(sanitized);
    } catch (err) {
      console.error("Balance API error:", err);
      setError('Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (balances.length > 0 && currentUser) {
      console.log("All balances after loading:", balances);
      console.log("Current user email:", currentUser.email);
      
      // Check which balances match our user
      const matchingFromUsername = balances.filter(b => b.from_user.username === currentUser.email);
      const matchingToUsername = balances.filter(b => b.to_user.username === currentUser.email);
      const matchingFromEmail = balances.filter(b => b.from_user.email === currentUser.email);
      const matchingToEmail = balances.filter(b => b.to_user.email === currentUser.email);
      
      console.log("Matching by from_user.username:", matchingFromUsername);
      console.log("Matching by to_user.username:", matchingToUsername);
      console.log("Matching by from_user.email:", matchingFromEmail);
      console.log("Matching by to_user.email:", matchingToEmail);
    }
  }, [balances, currentUser]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  // Make sure we have a current user
  if (!currentUser) return <Typography>Please log in to see balances</Typography>;

  const currentUserEmail = currentUser.email;
  
  // Try to match the user by both username and email
  const iOwe = balances.filter(b => 
    b.from_user.username === currentUserEmail || 
    b.from_user.email === currentUserEmail
  );

  const othersOweMe = balances.filter(b => 
    b.to_user.username === currentUserEmail || 
    b.to_user.email === currentUserEmail
  );

  return (
    <div>
      <Typography variant="h4" gutterBottom>My Balances</Typography>
      
      <Grid container spacing={4}>
        <Grid>
          <Paper elevation={3}>
            <Box sx={{ p: 2, bgcolor: 'error.light' }}>
              <Typography variant="h6">I Owe</Typography>
            </Box>
            <List>
              {iOwe.length === 0 ? (
                <ListItem>
                  <ListItemText primary="You don't owe anyone" />
                </ListItem>
              ) : (
                iOwe.map(b => (
                  <Fragment key={b.id}>
                    <ListItem>
                      <ListItemText
                        primary={`${b.to_user.first_name || b.to_user.username} ${b.to_user.last_name || ''}`}
                        secondary={`$${b.amount.toFixed(2)}`}
                      />
                    </ListItem>
                    <Divider />
                  </Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>
        
        <Grid>
          <Paper elevation={3}>
            <Box sx={{ p: 2, bgcolor: 'success.light' }}>
              <Typography variant="h6">Others Owe Me</Typography>
            </Box>
            <List>
              {othersOweMe.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No one owes you" />
                </ListItem>
              ) : (
                othersOweMe.map(b => (
                  <Fragment key={b.id}>
                    <ListItem>
                      <ListItemText
                        primary={`${b.from_user.first_name || b.from_user.username} ${b.from_user.last_name || ''}`}
                        secondary={`$${b.amount.toFixed(2)}`}
                      />
                    </ListItem>
                    <Divider />
                  </Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default BalanceList;