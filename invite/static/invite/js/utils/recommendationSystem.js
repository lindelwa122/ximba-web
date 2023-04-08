const updateScore = async (action, related, eventId=null, relatedUsername=null) => {
  let url;
  if (related === 'event') {
    url = `personalization/increment-scores?action=${action}&related=event&event_id=${eventId}`;
  } else if (related === 'person') {
    url = `personalization/increment-scores?action=${action}&related=person&related_username=${relatedUsername}`;
  }

  try {
    const response = await fetch(url);
    if (response.status === 200) {
      return true;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
}