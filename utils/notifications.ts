import Toast from 'react-native-toast-message';

export const showNotification = (type: string, title: string, content: string) => {
  let toastType: 'success' | 'info' | 'error' = 'info';
  let icon = '🔔';

  switch (type.toLowerCase()) {
    case 'meeting':
      icon = '📅';
      break;
    case 'notice':
      icon = '📢';
      break;
    case 'news':
      icon = '📰';
      break;
  }

  Toast.show({
    type: 'info',
    text1: `${icon} New ${type}: ${title}`,
    text2: content,
    position: 'top',
    visibilityTime: 4000,
    autoHide: true,
    topOffset: 50,
    props: {
      onPress: () => {
        Toast.hide();
      },
    },
  });
};