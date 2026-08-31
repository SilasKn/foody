import { PostHog } from 'posthog-react-native';

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;

const OPTIONS = {
  host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
  // Ohne 'memory' legt das SDK .posthog-rn.json mit einer dauerhaften Kennung
  // auf dem Geraet ab - das loest die Einwilligungspflicht nach § 25 TDDDG aus.
  persistence: 'memory',
  captureAppLifecycleEvents: false,
  // Als Objekt uebergeben ersetzt das die Default-Eigenschaften vollstaendig -
  // kein Geraetename, kein Hersteller, kein Locale, keine Zeitzone.
  customAppProperties: {},
  // Setzt $geoip_disable auf dem Event. Ohne das leitet PostHog serverseitig einen
  // Standort aus der IP ab - die Datenschutzerklaerung schliesst das aber aus.
  disableGeoip: true,
  // Feature Flags und Surveys werden nicht genutzt. Ohne das schickt das SDK bei
  // jedem Start zusaetzlich einen /flags-Request mit der distinct_id los.
  disableRemoteFeatureFlags: true,
  preloadFeatureFlags: false,
  disableSurveys: true,
  // Bei 'memory' stirbt ein noch nicht gesendetes Event mit dem Prozess. Sofort senden,
  // sonst zaehlt die Retention Nutzer nicht mit, die die App gleich wieder schliessen.
  flushAt: 1,
  // $screen_height/$screen_width setzt das RN-SDK hart in getCommonEventProperties;
  // customAppProperties entfernt sie nicht, nur before_send.
  before_send: (event) => {
    if (event?.properties) {
      delete event.properties.$screen_height;
      delete event.properties.$screen_width;
    }
    return event ?? null;
  },
};

// Die beiden Signup-Events feuern, bevor eine Session existiert. Sie laufen bewusst ueber
// einen eigenen anonymen Client: sonst haengt es am Timing von onAuthStateChange, ob
// signup_completed noch anonym oder schon identifiziert rausgeht. Lazy erzeugt, damit ein
// reiner Sign-in diesen Client nie anlegt.
let anonymousClient = null;

export function captureSignupEvent(event, properties) {
  if (!anonymousClient) anonymousClient = new PostHog(KEY, OPTIONS);
  anonymousClient.capture(event, properties);
}

// bootstrap mit isIdentifiedId setzt die distinct_id direkt beim Konstruieren. Damit
// entsteht keine anonyme ID und es wird kein $identify-Event gesendet - anders als bei
// identify(), das unter persistence: 'memory' bei jedem Start eine neue anonyme ID
// erzeugt und in die Person mergt.
export function createIdentifiedClient(userId) {
  return new PostHog(KEY, {
    ...OPTIONS,
    bootstrap: { distinctId: userId, isIdentifiedId: true },
  });
}
