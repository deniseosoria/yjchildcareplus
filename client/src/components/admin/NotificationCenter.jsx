import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Badge,
  Divider,
  Paper,
  Tab,
  Tabs,
  Alert,
} from "@mui/material";
import {
  Notifications as NotificationIcon,
  Delete as DeleteIcon,
  CheckCircle as ReadIcon,
  Send as SendIcon,
  Add as AddIcon,
  Announcement as BroadcastIcon,
} from "@mui/icons-material";
import { mockData } from "../../mockData/adminDashboardData";
import adminService from "../../services/adminService";
import { useSnackbar } from "notistack";

const NotificationCenter = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState(
    mockData.notificationTemplates || []
  );
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedRecipientType, setSelectedRecipientType] = useState("user");
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    content: "",
    recipientType: "user",
    selectedRecipient: "",
    variables: [],
  });
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);

  // Get users and classes from mock data
  const users = mockData.users || [];
  const classes = mockData.classes || [];

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await adminService.getNotifications();
      setNotifications(data);
    } catch (error) {
      handleError(error, "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      setLoading(true);
      await adminService.markNotificationAsRead(notificationId);
      await fetchNotifications();
    } catch (error) {
      handleError(error, "Failed to mark notification as read");
    } finally {
      setLoading(false);
    }
  };
  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await adminService.markAllNotificationsAsRead(); // <-- new endpoint
      await fetchNotifications();
    } catch (err) {
      handleError(err, "Failed to mark all notifications as read");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      setLoading(true);
      await adminService.deleteNotification(notificationId);
      await fetchNotifications();
      enqueueSnackbar("Notification deleted successfully", {
        variant: "success",
      });
    } catch (error) {
      handleError(error, "Failed to delete notification");
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (notificationData) => {
    try {
      setLoading(true);
      await adminService.sendNotification(notificationData);
      await fetchNotifications();
      enqueueSnackbar("Notification sent successfully", { variant: "success" });
      setShowSendDialog(false);
      setSelectedTemplate("");
      setBroadcastMessage("");
      setSelectedRecipient("");
      setSelectedRecipientType("user");
    } catch (error) {
      handleError(error, "Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    const recipient =
      newTemplate.recipientType === "user"
        ? users.find((u) => u.id === newTemplate.selectedRecipient)
        : classes.find((c) => c.id === newTemplate.selectedRecipient);

    const newTemplateData = {
      id: templates.length + 1,
      name: newTemplate.name,
      content: newTemplate.content,
      recipientType: newTemplate.recipientType,
      recipientId: newTemplate.selectedRecipient,
      recipientName: recipient?.name || recipient?.title,
      variables: newTemplate.variables,
      type: "custom",
    };
    setTemplates([...templates, newTemplateData]);
    setShowTemplateDialog(false);
    setNewTemplate({
      name: "",
      content: "",
      recipientType: "user",
      selectedRecipient: "",
      variables: [],
    });
  };

  const handleBroadcast = async () => {
    try {
      setLoading(true);
      await adminService.sendBroadcast({ message: broadcastMessage });
      await fetchNotifications();
      enqueueSnackbar("Broadcast sent successfully", { variant: "success" });
      setShowBroadcastDialog(false);
      setBroadcastMessage("");
    } catch (error) {
      handleError(error, "Failed to send broadcast");
    } finally {
      setLoading(false);
    }
  };

  const handleViewNotification = (notification) => {
    setSelectedNotification(notification);
    setNotificationDialogOpen(true);
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleError = (error, customMessage = "An error occurred") => {
    console.error(error);
    setError(error.message || customMessage);
    enqueueSnackbar(error.message || customMessage, { variant: "error" });
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        px: { xs: 1, sm: 2, md: 3 }, // Responsive padding
      }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Typography
          variant="h5"
          component="h2"
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          Notification Center
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} unread`}
              color="primary"
              size="small"
            />
          )}
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1,
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <Button
            startIcon={<AddIcon />}
            onClick={() => setShowTemplateDialog(true)}
            fullWidth={false}
            sx={{
              minWidth: { xs: "100%", sm: "auto" },
              whiteSpace: "nowrap",
            }}
          >
            New Template
          </Button>
          <Button
            startIcon={<SendIcon />}
            onClick={() => setShowSendDialog(true)}
            fullWidth={false}
            sx={{
              minWidth: { xs: "100%", sm: "auto" },
              whiteSpace: "nowrap",
            }}
          >
            Send Notification
          </Button>
          <Button
            startIcon={<BroadcastIcon />}
            onClick={() => setShowBroadcastDialog(true)}
            variant="contained"
            fullWidth={false}
            sx={{
              minWidth: { xs: "100%", sm: "auto" },
              whiteSpace: "nowrap",
            }}
          >
            Broadcast
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label="All Notifications" />
          <Tab label="Templates" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <>
          <Box
            sx={{
              mb: 2,
              display: "flex",
              justifyContent: "flex-end",
              width: "100%",
            }}
          >
            <Button
              startIcon={<ReadIcon />}
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              fullWidth={false}
              sx={{ whiteSpace: "nowrap" }}
            >
              Mark All as Read
            </Button>
          </Box>
          <List sx={{ width: "100%" }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  onClick={() => handleViewNotification(notification)}
                  sx={{
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "flex-start", sm: "center" },
                    gap: 1,
                    py: 2,
                    cursor: "pointer",
                  }}
                  secondaryAction={
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        mt: { xs: 1, sm: 0 },
                      }}
                    >
                      {!notification.read && (
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          size="small"
                        >
                          <ReadIcon />
                        </IconButton>
                      )}
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Badge
                      color="primary"
                      variant="dot"
                      invisible={notification.read}
                    >
                      <NotificationIcon />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle1"
                        component="div"
                        sx={{
                          fontWeight: notification.read ? "normal" : "bold",
                          wordBreak: "break-word",
                        }}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          wordBreak: "break-word",
                        }}
                      >
                        {notification.message}
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 0.5 }}
                        >
                          {new Date(notification.timestamp).toLocaleString()}
                        </Typography>
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </>
      )}

      {activeTab === 1 && (
        <List sx={{ width: "100%" }}>
          {templates.map((template) => (
            <ListItem
              key={template.id}
              sx={{
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 1,
                py: 2,
              }}
              secondaryAction={
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    mt: { xs: 1, sm: 0 },
                    justifyContent: { xs: "flex-start", sm: "flex-end" },
                  }}
                >
                  <Chip
                    label={
                      template.recipientType === "user"
                        ? "Student Template"
                        : "Class Template"
                    }
                    size="small"
                    color={
                      template.recipientType === "user"
                        ? "primary"
                        : "secondary"
                    }
                  />
                  <IconButton
                    edge="end"
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setSelectedRecipientType(template.recipientType);
                      setShowSendDialog(true);
                    }}
                    size="small"
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={
                  <Typography
                    variant="subtitle1"
                    component="div"
                    sx={{ wordBreak: "break-word" }}
                  >
                    {template.name}
                  </Typography>
                }
                secondary={
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      wordBreak: "break-word",
                    }}
                  >
                    {template.content}
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.5 }}
                    >
                      Variables:{" "}
                      {template.variables.map((v) => `{${v}}`).join(", ")}
                    </Typography>
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      {/* Send Notification Dialog */}
      <Dialog
        open={showSendDialog}
        onClose={() => {
          setShowSendDialog(false);
          setSelectedRecipient("");
          setSelectedTemplate("");
          setBroadcastMessage("");
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: "95%", sm: "auto" },
            maxHeight: { xs: "90vh", sm: "80vh" },
            m: { xs: 1, sm: 2 },
          },
        }}
      >
        <DialogTitle>Send Notification</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Template</InputLabel>
              <Select
                value={selectedTemplate}
                label="Select Template"
                onChange={(e) => {
                  const template = templates.find(
                    (t) => t.id === e.target.value
                  );
                  setSelectedTemplate(e.target.value);
                  if (template) {
                    setSelectedRecipientType(template.recipientType);
                    setBroadcastMessage(template.content);
                  } else {
                    setSelectedRecipientType("user");
                    setBroadcastMessage("");
                  }
                }}
              >
                <MenuItem value="">Custom Message</MenuItem>
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>
                Select{" "}
                {selectedTemplate
                  ? templates.find((t) => t.id === selectedTemplate)
                      ?.recipientType === "user"
                    ? "Student"
                    : "Class"
                  : "Recipient"}
              </InputLabel>
              <Select
                value={selectedRecipient}
                label={`Select ${
                  selectedTemplate
                    ? templates.find((t) => t.id === selectedTemplate)
                        ?.recipientType === "user"
                      ? "Student"
                      : "Class"
                    : "Recipient"
                }`}
                onChange={(e) => setSelectedRecipient(e.target.value)}
              >
                {selectedTemplate
                  ? templates.find((t) => t.id === selectedTemplate)
                      ?.recipientType === "user"
                    ? users.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.name}
                        </MenuItem>
                      ))
                    : classes.map((cls) => (
                        <MenuItem key={cls.id} value={cls.id}>
                          {cls.title}
                        </MenuItem>
                      ))
                  : [...users, ...classes].map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name || item.title}
                      </MenuItem>
                    ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Message"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              helperText={
                selectedTemplate
                  ? `Template variables will be replaced automatically. Available variables: ${templates
                      .find((t) => t.id === selectedTemplate)
                      ?.variables.map((v) => `{${v}}`)
                      .join(", ")}`
                  : ""
              }
            />

            {selectedTemplate && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Preview:
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                  <Typography variant="body2">
                    {broadcastMessage.replace(
                      /\{([^}]+)\}/g,
                      (match, variable) => {
                        switch (variable) {
                          case "student_name":
                            return (
                              users.find((u) => u.id === selectedRecipient)
                                ?.name || "{student_name}"
                            );
                          case "class_name":
                            return (
                              classes.find((c) => c.id === selectedRecipient)
                                ?.title || "{class_name}"
                            );
                          case "student_count":
                            return "15"; // Mock value
                          case "teacher_name":
                            return "Mrs. Smith"; // Mock value
                          case "time":
                            return "30"; // Mock value
                          case "amount":
                            return "$150.00"; // Mock value
                          case "days":
                            return "3"; // Mock value
                          case "certificate_name":
                            return "Art Fundamentals"; // Mock value
                          default:
                            return match;
                        }
                      }
                    )}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowSendDialog(false);
              setSelectedRecipient("");
              setSelectedTemplate("");
              setBroadcastMessage("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() =>
              handleSendNotification({
                title: selectedTemplate
                  ? templates.find((t) => t.id === selectedTemplate)?.name
                  : "Custom Notification",
                message: broadcastMessage,
                recipient:
                  selectedRecipientType === "user"
                    ? users.find((u) => u.id === selectedRecipient)?.name
                    : classes.find((c) => c.id === selectedRecipient)?.title,
                recipientType: selectedRecipientType,
              })
            }
            variant="contained"
            disabled={!selectedRecipient || !broadcastMessage}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog
        open={showTemplateDialog}
        onClose={() => {
          setShowTemplateDialog(false);
          setNewTemplate({
            name: "",
            content: "",
            recipientType: "user",
            selectedRecipient: "",
            variables: [],
          });
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: "95%", sm: "auto" },
            maxHeight: { xs: "90vh", sm: "80vh" },
            m: { xs: 1, sm: 2 },
          },
        }}
      >
        <DialogTitle>Create Notification Template</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Template For</InputLabel>
              <Select
                value={newTemplate.recipientType}
                label="Template For"
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    recipientType: e.target.value,
                    selectedRecipient: "",
                    variables:
                      e.target.value === "user"
                        ? ["student_name", "class_name", "grade"]
                        : ["class_name", "student_count", "teacher_name"],
                  })
                }
              >
                <MenuItem value="user">Specific Student</MenuItem>
                <MenuItem value="class">Specific Class</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>
                Select{" "}
                {newTemplate.recipientType === "user" ? "Student" : "Class"}
              </InputLabel>
              <Select
                value={newTemplate.selectedRecipient}
                label={`Select ${
                  newTemplate.recipientType === "user" ? "Student" : "Class"
                }`}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    selectedRecipient: e.target.value,
                    name: e.target.value
                      ? `${
                          newTemplate.recipientType === "user"
                            ? users.find((u) => u.id === e.target.value)?.name
                            : classes.find((c) => c.id === e.target.value)
                                ?.title
                        } - `
                      : "",
                  })
                }
              >
                {newTemplate.recipientType === "user"
                  ? users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
                      </MenuItem>
                    ))
                  : classes.map((cls) => (
                      <MenuItem key={cls.id} value={cls.id}>
                        {cls.title}
                      </MenuItem>
                    ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Template Name"
              value={newTemplate.name}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, name: e.target.value })
              }
              sx={{ mb: 2 }}
              helperText={`Name for your ${
                newTemplate.recipientType === "user" ? "student" : "class"
              } template`}
              placeholder={
                newTemplate.selectedRecipient
                  ? `${
                      newTemplate.recipientType === "user"
                        ? users.find(
                            (u) => u.id === newTemplate.selectedRecipient
                          )?.name
                        : classes.find(
                            (c) => c.id === newTemplate.selectedRecipient
                          )?.title
                    } - `
                  : "Enter template name"
              }
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Template Content"
              value={newTemplate.content}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, content: e.target.value })
              }
              helperText={
                <Box component="span">
                  Available variables:{" "}
                  {newTemplate.variables.map((v) => `{${v}}`).join(", ")}
                  <br />
                  {newTemplate.recipientType === "user"
                    ? "Use {student_name} for the student's name, {class_name} for their class, and {grade} for their grade"
                    : "Use {class_name} for the class name, {student_count} for the number of students, and {teacher_name} for the teacher's name"}
                </Box>
              }
            />

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Template Preview:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                <Typography variant="body2">
                  {newTemplate.content.replace(
                    /\{([^}]+)\}/g,
                    (match, variable) => {
                      switch (variable) {
                        case "student_name":
                          return newTemplate.selectedRecipient &&
                            newTemplate.recipientType === "user"
                            ? users.find(
                                (u) => u.id === newTemplate.selectedRecipient
                              )?.name || "{student_name}"
                            : "{student_name}";
                        case "class_name":
                          return newTemplate.selectedRecipient &&
                            newTemplate.recipientType === "class"
                            ? classes.find(
                                (c) => c.id === newTemplate.selectedRecipient
                              )?.title || "{class_name}"
                            : "{class_name}";
                        case "grade":
                          return "A+";
                        case "student_count":
                          return "15";
                        case "teacher_name":
                          return "Mrs. Smith";
                        default:
                          return match;
                      }
                    }
                  )}
                </Typography>
              </Paper>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowTemplateDialog(false);
              setNewTemplate({
                name: "",
                content: "",
                recipientType: "user",
                selectedRecipient: "",
                variables: [],
              });
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateTemplate}
            variant="contained"
            disabled={
              !newTemplate.name ||
              !newTemplate.content ||
              !newTemplate.selectedRecipient
            }
          >
            Create Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Broadcast Dialog */}
      <Dialog
        open={showBroadcastDialog}
        onClose={() => setShowBroadcastDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: "95%", sm: "auto" },
            maxHeight: { xs: "90vh", sm: "80vh" },
            m: { xs: 1, sm: 2 },
          },
        }}
      >
        <DialogTitle>Broadcast Message</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Broadcast Message"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              helperText="This message will be sent to all users"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBroadcastDialog(false)}>Cancel</Button>
          <Button onClick={handleBroadcast} variant="contained" color="primary">
            Broadcast
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationCenter;
