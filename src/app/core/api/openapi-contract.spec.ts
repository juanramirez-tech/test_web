import openApi from './openapi-paths.json';
import { API } from './api.endpoints';

function asTemplate(path: string): string {
  return path.replace(/\/\d+/g, '/{id}');
}

describe('OpenAPI contract', () => {
  const specPaths = new Set(openApi.paths);

  const clientPaths = [
    API.health,
    API.login,
    API.v1.courts,
    API.v1.courtsAvailability,
    asTemplate(API.v1.court(1)),
    asTemplate(API.v1.courtAvailability(1)),
    API.v1.bookings,
    API.v1.myBooking,
    API.v1.payBooking,
    API.v1.cancelBooking,
    API.v1.admin.courts,
    asTemplate(API.v1.admin.court(1)),
    API.v1.admin.bookings,
    asTemplate(API.v1.admin.booking(1)),
    asTemplate(API.v1.admin.confirmBooking(1)),
    asTemplate(API.v1.admin.cancelBooking(1)),
  ];

  it('keeps every client endpoint in the OpenAPI snapshot', () => {
    for (const path of clientPaths) {
      expect(specPaths.has(path)).withContext(path).toBeTrue();
    }
  });
});
