import { POPULAR_AIRPORTS, type AirportItem } from './airportService';

export interface RealFlightSchedule {
  id: string;
  flightNumber: string; // e.g. '7C1402'
  airline: string; // e.g. '제주항공'
  airlineCode: string; // e.g. '7C'
  airlineColor: string; // 브랜드 포인트 컬러
  departureAirport: string; // e.g. '인천국제공항 (ICN)'
  departureCode: string; // e.g. 'ICN'
  arrivalAirport: string; // e.g. '후쿠오카 공항 (FUK)'
  arrivalCode: string; // e.g. 'FUK'
  departureTime: string; // e.g. '06:25'
  arrivalTime: string; // e.g. '07:50'
  durationText: string; // e.g. '1시간 25분'
  arrivalNextDay: boolean; // +1일 익일 도착 여부
  terminal: string; // e.g. '제1여객터미널'
  direction: 'outbound' | 'return';
  pairedFlightNumber?: string;
}

export const AIRLINE_META: Record<
  string,
  { name: string; color: string; defaultTerminal: string }
> = {
  '7C': { name: '제주항공', color: '#FF5A00', defaultTerminal: '제1여객터미널' },
  LJ: { name: '진에어', color: '#0D9488', defaultTerminal: '제2여객터미널' },
  TW: { name: '티웨이항공', color: '#D2232A', defaultTerminal: '제1여객터미널' },
  ZE: { name: '이스타항공', color: '#E11D48', defaultTerminal: '제1여객터미널' },
  RS: { name: '에어서울', color: '#00A699', defaultTerminal: '제1여객터미널' },
  BX: { name: '에어부산', color: '#1D4ED8', defaultTerminal: '제1여객터미널' },
  YP: { name: '에어프레미아', color: '#1E3A8A', defaultTerminal: '제1여객터미널' },
  RF: { name: '에어로케이', color: '#0F172A', defaultTerminal: '제1여객터미널' },
  KE: { name: '대한항공', color: '#004098', defaultTerminal: '제2여객터미널' },
  OZ: { name: '아시아나항공', color: '#B91C1C', defaultTerminal: '제1여객터미널' },
  MM: { name: '피치항공', color: '#C026D3', defaultTerminal: '제1여객터미널' },
  JL: { name: '일본항공 (JAL)', color: '#DC2626', defaultTerminal: '제1여객터미널' },
  NH: { name: '전일본공수 (ANA)', color: '#1E40AF', defaultTerminal: '제1여객터미널' },
  VJ: { name: '비엣젯항공', color: '#DC2626', defaultTerminal: '제1여객터미널' },
  VN: { name: '베트남항공', color: '#0284C7', defaultTerminal: '제1여객터미널' },
  TG: { name: '타이항공', color: '#7E22CE', defaultTerminal: '제1여객터미널' },
  XJ: { name: '타이에어아시아X', color: '#EF4444', defaultTerminal: '제1여객터미널' },
  SQ: { name: '싱가포르항공', color: '#B45309', defaultTerminal: '제1여객터미널' },
  TR: { name: '스쿠트항공', color: '#D97706', defaultTerminal: '제1여객터미널' },
  CI: { name: '중화항공', color: '#2563EB', defaultTerminal: '제2여객터미널' },
  BR: { name: '에바항공', color: '#059669', defaultTerminal: '제1여객터미널' },
  CX: { name: '캐세이퍼시픽', color: '#0F766E', defaultTerminal: '제1여객터미널' },
  UO: { name: '홍콩익스프레스', color: '#6D28D9', defaultTerminal: '제1여객터미널' },
  '5J': { name: '세부퍼시픽', color: '#0284C7', defaultTerminal: '제1여객터미널' },
  PR: { name: '필리핀항공', color: '#1E3A8A', defaultTerminal: '제1여객터미널' },
  GA: { name: '가루다인도네시아', color: '#0369A1', defaultTerminal: '제2여객터미널' },
  HA: { name: '하와이안항공', color: '#7C3AED', defaultTerminal: '제1여객터미널' },
  UA: { name: '유나이티드항공', color: '#1D4ED8', defaultTerminal: '제1여객터미널' },
  DL: { name: '델타항공', color: '#1E3A8A', defaultTerminal: '제2여객터미널' },
  AF: { name: '에어프랑스', color: '#1E40AF', defaultTerminal: '제2여객터미널' },
  LH: { name: '루프트한자', color: '#0F172A', defaultTerminal: '제1여객터미널' },
};

interface RouteSlotTemplate {
  airlineCode: string;
  outNo: string;
  retNo: string;
  outDep: string;
  outArr: string;
  outNextDay?: boolean;
  retDep: string;
  retArr: string;
  retNextDay?: boolean;
  durationText: string;
  terminal?: string;
}

/**
 * 노선별 실제 항공사 다양성(제주항공, 진에어, 티웨이, 이스타, 에어서울, 에어부산, 에어프레미아, 대한항공, 아시아나, 현지항공사)이 반영된 시간표 DB
 */
const ROUTE_SCHEDULES_DB: Record<string, RouteSlotTemplate[]> = {
  // 1. 인천(ICN) <-> 후쿠오카(FUK)
  'ICN-FUK': [
    { airlineCode: '7C', outNo: '7C1402', retNo: '7C1401', outDep: '06:25', outArr: '07:50', retDep: '08:50', retArr: '10:15', durationText: '1시간 25분' },
    { airlineCode: 'ZE', outNo: 'ZE641', retNo: 'ZE642', outDep: '06:45', outArr: '08:05', retDep: '09:05', retArr: '10:25', durationText: '1시간 20분' },
    { airlineCode: 'LJ', outNo: 'LJ261', retNo: 'LJ262', outDep: '07:10', outArr: '08:30', retDep: '09:30', retArr: '10:50', durationText: '1시간 20분' },
    { airlineCode: 'BX', outNo: 'BX164', retNo: 'BX163', outDep: '07:20', outArr: '08:50', retDep: '09:45', retArr: '11:15', durationText: '1시간 30분' },
    { airlineCode: 'KE', outNo: 'KE787', retNo: 'KE788', outDep: '08:00', outArr: '09:20', retDep: '10:30', retArr: '11:55', durationText: '1시간 20분' },
    { airlineCode: 'RS', outNo: 'RS721', retNo: 'RS722', outDep: '08:20', outArr: '09:45', retDep: '10:40', retArr: '12:05', durationText: '1시간 25분' },
    { airlineCode: 'OZ', outNo: 'OZ132', retNo: 'OZ131', outDep: '09:00', outArr: '10:20', retDep: '11:30', retArr: '12:50', durationText: '1시간 20분' },
    { airlineCode: 'LJ', outNo: 'LJ263', retNo: 'LJ264', outDep: '09:50', outArr: '11:10', retDep: '12:10', retArr: '13:30', durationText: '1시간 20분' },
    { airlineCode: 'TW', outNo: 'TW291', retNo: 'TW292', outDep: '10:10', outArr: '11:30', retDep: '12:30', retArr: '13:50', durationText: '1시간 20분' },
    { airlineCode: '7C', outNo: '7C1404', retNo: '7C1403', outDep: '10:30', outArr: '11:55', retDep: '12:55', retArr: '14:20', durationText: '1시간 25분' },
    { airlineCode: 'OZ', outNo: 'OZ134', retNo: 'OZ133', outDep: '12:30', outArr: '13:50', retDep: '14:50', retArr: '16:10', durationText: '1시간 20분' },
    { airlineCode: 'KE', outNo: 'KE789', retNo: 'KE790', outDep: '12:35', outArr: '14:00', retDep: '15:05', retArr: '16:30', durationText: '1시간 25분' },
    { airlineCode: 'LJ', outNo: 'LJ265', retNo: 'LJ266', outDep: '15:10', outArr: '16:35', retDep: '17:35', retArr: '18:55', durationText: '1시간 25분' },
    { airlineCode: '7C', outNo: '7C1406', retNo: '7C1405', outDep: '15:50', outArr: '17:10', retDep: '18:05', retArr: '19:30', durationText: '1시간 20분' },
    { airlineCode: 'TW', outNo: 'TW295', retNo: 'TW296', outDep: '18:05', outArr: '19:25', retDep: '20:25', retArr: '21:40', durationText: '1시간 20분' },
    { airlineCode: 'KE', outNo: 'KE781', retNo: 'KE782', outDep: '18:20', outArr: '19:45', retDep: '21:00', retArr: '22:20', durationText: '1시간 25분' },
  ],

  // 2. 김해/부산(PUS) <-> 후쿠오카(FUK)
  'PUS-FUK': [
    { airlineCode: 'LJ', outNo: 'LJ291', retNo: 'LJ292', outDep: '07:30', outArr: '08:25', retDep: '09:25', retArr: '10:20', durationText: '55분' },
    { airlineCode: '7C', outNo: '7C1452', retNo: '7C1451', outDep: '08:00', outArr: '08:55', retDep: '09:55', retArr: '10:50', durationText: '55분' },
    { airlineCode: 'BX', outNo: 'BX142', retNo: 'BX141', outDep: '09:00', outArr: '09:55', retDep: '10:50', retArr: '11:45', durationText: '55분' },
    { airlineCode: 'KE', outNo: 'KE2135', retNo: 'KE2136', outDep: '09:10', outArr: '10:05', retDep: '11:05', retArr: '12:00', durationText: '55분' },
    { airlineCode: 'BX', outNo: 'BX144', retNo: 'BX143', outDep: '14:00', outArr: '14:55', retDep: '15:50', retArr: '16:45', durationText: '55분' },
    { airlineCode: '7C', outNo: '7C1454', retNo: '7C1453', outDep: '17:50', outArr: '18:45', retDep: '19:45', retArr: '20:40', durationText: '55분' },
  ],

  // 3. 인천(ICN) <-> 도쿄 나리타(NRT)
  'ICN-NRT': [
    { airlineCode: 'LJ', outNo: 'LJ201', retNo: 'LJ202', outDep: '07:25', outArr: '09:50', retDep: '11:00', retArr: '13:35', durationText: '2시간 25분' },
    { airlineCode: 'TW', outNo: 'TW211', retNo: 'TW212', outDep: '07:45', outArr: '10:15', retDep: '12:00', retArr: '15:00', durationText: '2시간 30분' },
    { airlineCode: 'ZE', outNo: 'ZE601', retNo: 'ZE602', outDep: '08:00', outArr: '10:25', retDep: '11:30', retArr: '14:10', durationText: '2시간 25분' },
    { airlineCode: '7C', outNo: '7C1102', retNo: '7C1101', outDep: '08:30', outArr: '10:50', retDep: '11:50', retArr: '14:35', durationText: '2시간 20분' },
    { airlineCode: 'YP', outNo: 'YP101', retNo: 'YP102', outDep: '08:50', outArr: '11:20', retDep: '12:30', retArr: '15:10', durationText: '2시간 30분' },
    { airlineCode: 'OZ', outNo: 'OZ102', retNo: 'OZ101', outDep: '09:00', outArr: '11:20', retDep: '13:20', retArr: '15:50', durationText: '2시간 20분' },
    { airlineCode: 'RS', outNo: 'RS701', retNo: 'RS702', outDep: '09:00', outArr: '11:20', retDep: '12:20', retArr: '14:55', durationText: '2시간 20분' },
    { airlineCode: 'LJ', outNo: 'LJ203', retNo: 'LJ204', outDep: '10:05', outArr: '12:30', retDep: '13:30', retArr: '16:05', durationText: '2시간 25분' },
    { airlineCode: 'KE', outNo: 'KE703', retNo: 'KE704', outDep: '10:10', outArr: '12:35', retDep: '13:55', retArr: '16:30', durationText: '2시간 25분' },
    { airlineCode: '7C', outNo: '7C1104', retNo: '7C1103', outDep: '15:05', outArr: '17:30', retDep: '18:30', retArr: '21:15', durationText: '2시간 25분' },
    { airlineCode: 'TW', outNo: 'TW215', retNo: 'TW216', outDep: '15:25', outArr: '18:05', retDep: '19:05', retArr: '22:00', durationText: '2시간 40분' },
    { airlineCode: 'KE', outNo: 'KE705', retNo: 'KE706', outDep: '18:35', outArr: '21:00', retDep: '12:00', retArr: '14:40', durationText: '2시간 25분' },
    { airlineCode: 'OZ', outNo: 'OZ108', retNo: 'OZ107', outDep: '18:35', outArr: '21:00', retDep: '09:00', retArr: '11:30', durationText: '2시간 25분' },
  ],

  // 4. 김포(GMP) / 인천(ICN) <-> 도쿄 하네다(HND)
  'GMP-HND': [
    { airlineCode: 'NH', outNo: 'NH862', retNo: 'NH861', outDep: '07:45', outArr: '09:55', retDep: '08:40', retArr: '11:05', durationText: '2시간 10분' },
    { airlineCode: 'JL', outNo: 'JL90', retNo: 'JL91', outDep: '08:00', outArr: '10:10', retDep: '08:20', retArr: '10:45', durationText: '2시간 10분' },
    { airlineCode: 'KE', outNo: 'KE2101', retNo: 'KE2102', outDep: '08:40', outArr: '10:45', retDep: '12:05', retArr: '14:25', durationText: '2시간 05분' },
    { airlineCode: 'OZ', outNo: 'OZ1085', retNo: 'OZ1075', outDep: '08:40', outArr: '10:45', retDep: '12:05', retArr: '14:25', durationText: '2시간 05분' },
    { airlineCode: 'JL', outNo: 'JL92', retNo: 'JL93', outDep: '12:05', outArr: '14:15', retDep: '15:30', retArr: '18:00', durationText: '2시간 10분' },
    { airlineCode: 'KE', outNo: 'KE2103', retNo: 'KE2104', outDep: '16:15', outArr: '18:30', retDep: '19:45', retArr: '22:05', durationText: '2시간 15분' },
    { airlineCode: 'OZ', outNo: 'OZ1065', retNo: 'OZ1055', outDep: '16:20', outArr: '18:30', retDep: '19:50', retArr: '22:10', durationText: '2시간 10분' },
  ],
  'ICN-HND': [
    { airlineCode: 'KE', outNo: 'KE719', retNo: 'KE720', outDep: '20:30', outArr: '22:50', retDep: '02:00', retArr: '04:35', durationText: '2시간 20분' },
    { airlineCode: 'MM', outNo: 'MM808', retNo: 'MM809', outDep: '22:40', outArr: '00:55', outNextDay: true, retDep: '01:55', retArr: '04:35', durationText: '2시간 15분' },
  ],

  // 5. 인천(ICN) <-> 오사카 간사이(KIX)
  'ICN-KIX': [
    { airlineCode: 'MM', outNo: 'MM002', retNo: 'MM001', outDep: '07:30', outArr: '09:15', retDep: '07:40', retArr: '09:35', durationText: '1시간 45분' },
    { airlineCode: 'TW', outNo: 'TW281', retNo: 'TW282', outDep: '07:50', outArr: '09:40', retDep: '10:50', retArr: '12:50', durationText: '1시간 50분' },
    { airlineCode: 'OZ', outNo: 'OZ112', retNo: 'OZ111', outDep: '07:55', outArr: '09:40', retDep: '10:50', retArr: '12:50', durationText: '1시간 45분' },
    { airlineCode: 'LJ', outNo: 'LJ231', retNo: 'LJ232', outDep: '07:55', outArr: '09:45', retDep: '10:55', retArr: '12:50', durationText: '1시간 50분' },
    { airlineCode: 'ZE', outNo: 'ZE611', retNo: 'ZE612', outDep: '09:00', outArr: '10:45', retDep: '11:45', retArr: '13:35', durationText: '1시간 45분' },
    { airlineCode: '7C', outNo: '7C1302', retNo: '7C1301', outDep: '09:10', outArr: '11:00', retDep: '11:50', retArr: '13:50', durationText: '1시간 50분' },
    { airlineCode: 'KE', outNo: 'KE723', retNo: 'KE724', outDep: '09:35', outArr: '11:20', retDep: '12:25', retArr: '14:25', durationText: '1시간 45분' },
    { airlineCode: 'TW', outNo: 'TW283', retNo: 'TW284', outDep: '12:05', outArr: '13:50', retDep: '14:55', retArr: '16:50', durationText: '1시간 45분' },
    { airlineCode: 'LJ', outNo: 'LJ235', retNo: 'LJ236', outDep: '13:30', outArr: '15:15', retDep: '16:15', retArr: '18:05', durationText: '1시간 45분' },
    { airlineCode: '7C', outNo: '7C1304', retNo: '7C1303', outDep: '13:45', outArr: '15:30', retDep: '16:30', retArr: '18:30', durationText: '1시간 45분' },
    { airlineCode: 'OZ', outNo: 'OZ114', retNo: 'OZ113', outDep: '14:05', outArr: '15:50', retDep: '17:00', retArr: '19:00', durationText: '1시간 45분' },
    { airlineCode: 'KE', outNo: 'KE725', retNo: 'KE726', outDep: '15:05', outArr: '16:55', retDep: '18:05', retArr: '20:05', durationText: '1시간 50분' },
  ],

  // 6. 인천(ICN) <-> 삿포로(CTS)
  'ICN-CTS': [
    { airlineCode: '7C', outNo: '7C1902', retNo: '7C1901', outDep: '07:10', outArr: '10:00', retDep: '11:00', retArr: '14:15', durationText: '2시간 50분' },
    { airlineCode: 'ZE', outNo: 'ZE621', retNo: 'ZE622', outDep: '07:40', outArr: '10:25', retDep: '11:25', retArr: '14:35', durationText: '2시간 45분' },
    { airlineCode: 'LJ', outNo: 'LJ301', retNo: 'LJ302', outDep: '08:35', outArr: '11:20', retDep: '12:30', retArr: '15:40', durationText: '2시간 45분' },
    { airlineCode: 'OZ', outNo: 'OZ174', retNo: 'OZ173', outDep: '09:10', outArr: '11:55', retDep: '13:05', retArr: '16:15', durationText: '2시간 45분' },
    { airlineCode: 'KE', outNo: 'KE765', retNo: 'KE766', outDep: '10:05', outArr: '12:45', retDep: '14:00', retArr: '17:15', durationText: '2시간 40분' },
    { airlineCode: 'TW', outNo: 'TW251', retNo: 'TW252', outDep: '10:25', outArr: '13:10', retDep: '14:10', retArr: '17:25', durationText: '2시간 45분' },
  ],

  // 7. 인천(ICN) <-> 오키나와(OKA)
  'ICN-OKA': [
    { airlineCode: 'KE', outNo: 'KE755', retNo: 'KE756', outDep: '08:05', outArr: '10:25', retDep: '11:35', retArr: '13:55', durationText: '2시간 20분' },
    { airlineCode: 'OZ', outNo: 'OZ172', retNo: 'OZ171', outDep: '09:15', outArr: '11:30', retDep: '12:40', retArr: '14:55', durationText: '2시간 15분' },
    { airlineCode: 'LJ', outNo: 'LJ341', retNo: 'LJ342', outDep: '10:15', outArr: '12:30', retDep: '13:30', retArr: '15:45', durationText: '2시간 15분' },
    { airlineCode: 'TW', outNo: 'TW271', retNo: 'TW272', outDep: '11:20', outArr: '13:40', retDep: '14:40', retArr: '17:00', durationText: '2시간 20분' },
    { airlineCode: '7C', outNo: '7C1802', retNo: '7C1801', outDep: '13:15', outArr: '15:35', retDep: '16:35', retArr: '19:05', durationText: '2시간 20분' },
    { airlineCode: 'ZE', outNo: 'ZE631', retNo: 'ZE632', outDep: '14:10', outArr: '16:30', retDep: '17:30', retArr: '19:55', durationText: '2시간 20분' },
  ],

  // 8. 인천(ICN) <-> 나고야(NGO)
  'ICN-NGO': [
    { airlineCode: '7C', outNo: '7C1602', retNo: '7C1601', outDep: '07:20', outArr: '09:10', retDep: '10:00', retArr: '12:10', durationText: '1시간 50분' },
    { airlineCode: 'LJ', outNo: 'LJ271', retNo: 'LJ272', outDep: '07:35', outArr: '09:25', retDep: '10:25', retArr: '12:30', durationText: '1시간 50분' },
    { airlineCode: 'KE', outNo: 'KE741', retNo: 'KE742', outDep: '08:15', outArr: '10:10', retDep: '11:20', retArr: '13:25', durationText: '1시간 55분' },
    { airlineCode: 'OZ', outNo: 'OZ122', retNo: 'OZ121', outDep: '08:30', outArr: '10:25', retDep: '11:25', retArr: '13:30', durationText: '1시간 55분' },
    { airlineCode: '7C', outNo: '7C1604', retNo: '7C1603', outDep: '14:00', outArr: '15:50', retDep: '16:40', retArr: '18:50', durationText: '1시간 50분' },
  ],

  // 9. 인천(ICN) <-> 다낭(DAD)
  'ICN-DAD': [
    { airlineCode: 'VJ', outNo: 'VJ881', retNo: 'VJ880', outDep: '06:55', outArr: '09:40', retDep: '23:45', retArr: '06:00', retNextDay: true, durationText: '4시간 45분' },
    { airlineCode: 'TW', outNo: 'TW125', retNo: 'TW126', outDep: '07:45', outArr: '10:50', retDep: '11:50', retArr: '18:20', durationText: '5시간 05분' },
    { airlineCode: 'LJ', outNo: 'LJ081', retNo: 'LJ082', outDep: '09:55', outArr: '12:45', retDep: '13:45', retArr: '20:25', durationText: '4시간 50분' },
    { airlineCode: '7C', outNo: '7C2901', retNo: '7C2902', outDep: '10:40', outArr: '13:40', retDep: '14:40', retArr: '21:20', durationText: '5시간 00분' },
    { airlineCode: 'VN', outNo: 'VN431', retNo: 'VN430', outDep: '11:20', outArr: '14:10', retDep: '23:35', retArr: '06:00', retNextDay: true, durationText: '4시간 50분' },
    { airlineCode: 'KE', outNo: 'KE461', retNo: 'KE462', outDep: '18:30', outArr: '21:25', retDep: '22:50', retArr: '05:25', retNextDay: true, durationText: '4시간 55분' },
    { airlineCode: 'OZ', outNo: 'OZ755', retNo: 'OZ756', outDep: '18:30', outArr: '21:35', retDep: '22:55', retArr: '05:30', retNextDay: true, durationText: '5시간 05분' },
    { airlineCode: 'ZE', outNo: 'ZE591', retNo: 'ZE592', outDep: '18:30', outArr: '21:20', retDep: '22:20', retArr: '05:00', retNextDay: true, durationText: '4시간 50분' },
    { airlineCode: 'RS', outNo: 'RS511', retNo: 'RS512', outDep: '20:25', outArr: '23:25', retDep: '00:25', retArr: '07:10', durationText: '5시간 00분' },
    { airlineCode: 'TW', outNo: 'TW127', retNo: 'TW128', outDep: '20:55', outArr: '00:05', outNextDay: true, retDep: '01:25', retArr: '07:55', durationText: '5시간 10분' },
    { airlineCode: 'LJ', outNo: 'LJ083', retNo: 'LJ084', outDep: '21:10', outArr: '00:05', outNextDay: true, retDep: '01:20', retArr: '07:50', durationText: '4시간 55분' },
    { airlineCode: '7C', outNo: '7C2903', retNo: '7C2904', outDep: '21:30', outArr: '00:40', outNextDay: true, retDep: '01:40', retArr: '08:20', durationText: '5시간 10분' },
  ],

  // 10. 인천(ICN) <-> 나트랑(CXR)
  'ICN-CXR': [
    { airlineCode: 'VJ', outNo: 'VJ837', retNo: 'VJ836', outDep: '06:20', outArr: '09:55', retDep: '16:15', retArr: '22:45', durationText: '5시간 35분' },
    { airlineCode: 'VN', outNo: 'VN441', retNo: 'VN440', outDep: '06:20', outArr: '09:45', retDep: '21:25', retArr: '04:10', retNextDay: true, durationText: '5시간 25분' },
    { airlineCode: 'RS', outNo: 'RS527', retNo: 'RS528', outDep: '08:00', outArr: '11:10', retDep: '12:10', retArr: '19:15', durationText: '5시간 10분' },
    { airlineCode: 'TW', outNo: 'TW157', retNo: 'TW158', outDep: '19:35', outArr: '22:50', retDep: '23:50', retArr: '06:50', retNextDay: true, durationText: '5시간 15분' },
    { airlineCode: 'KE', outNo: 'KE467', retNo: 'KE468', outDep: '20:30', outArr: '23:45', retDep: '00:50', retArr: '07:55', durationText: '5시간 15분' },
    { airlineCode: 'LJ', outNo: 'LJ087', retNo: 'LJ088', outDep: '20:55', outArr: '00:05', outNextDay: true, retDep: '01:15', retArr: '08:15', durationText: '5시간 10분' },
    { airlineCode: 'ZE', outNo: 'ZE561', retNo: 'ZE562', outDep: '21:10', outArr: '00:20', outNextDay: true, retDep: '01:20', retArr: '08:20', durationText: '5시간 10분' },
    { airlineCode: '7C', outNo: '7C2301', retNo: '7C2302', outDep: '21:50', outArr: '01:15', outNextDay: true, retDep: '02:15', retArr: '09:10', durationText: '5시간 25분' },
  ],

  // 11. 인천(ICN) <-> 하노이(HAN)
  'ICN-HAN': [
    { airlineCode: 'VJ', outNo: 'VJ961', retNo: 'VJ960', outDep: '06:25', outArr: '09:15', retDep: '23:30', retArr: '05:25', retNextDay: true, durationText: '4시간 50분' },
    { airlineCode: '7C', outNo: '7C2801', retNo: '7C2802', outDep: '09:15', outArr: '12:05', retDep: '13:00', retArr: '19:20', durationText: '4시간 50분' },
    { airlineCode: 'KE', outNo: 'KE441', retNo: 'KE442', outDep: '09:25', outArr: '12:10', retDep: '13:30', retArr: '19:50', durationText: '4시간 45분' },
    { airlineCode: 'OZ', outNo: 'OZ729', retNo: 'OZ730', outDep: '09:50', outArr: '12:20', retDep: '13:30', retArr: '19:50', durationText: '4시간 30분' },
    { airlineCode: 'VN', outNo: 'VN417', retNo: 'VN416', outDep: '10:35', outArr: '13:05', retDep: '23:35', retArr: '05:50', retNextDay: true, durationText: '4시간 30분' },
    { airlineCode: 'KE', outNo: 'KE455', retNo: 'KE456', outDep: '18:55', outArr: '21:50', retDep: '23:15', retArr: '05:30', retNextDay: true, durationText: '4시간 55분' },
    { airlineCode: 'OZ', outNo: 'OZ733', retNo: 'OZ734', outDep: '19:30', outArr: '22:00', retDep: '23:30', retArr: '05:50', retNextDay: true, durationText: '4시간 30분' },
  ],

  // 12. 인천(ICN) <-> 푸꾸옥(PQC)
  'ICN-PQC': [
    { airlineCode: 'VJ', outNo: 'VJ975', retNo: 'VJ974', outDep: '01:45', outArr: '05:35', retDep: '15:35', retArr: '22:55', durationText: '5시간 50분' },
    { airlineCode: 'KE', outNo: 'KE485', retNo: 'KE486', outDep: '15:45', outArr: '19:50', retDep: '21:20', retArr: '04:50', retNextDay: true, durationText: '6시간 05분' },
    { airlineCode: 'LJ', outNo: 'LJ091', retNo: 'LJ092', outDep: '17:25', outArr: '21:20', retDep: '22:20', retArr: '05:55', retNextDay: true, durationText: '5시간 55분' },
    { airlineCode: 'ZE', outNo: 'ZE581', retNo: 'ZE582', outDep: '17:50', outArr: '21:40', retDep: '22:40', retArr: '06:10', retNextDay: true, durationText: '5시간 50분' },
    { airlineCode: '7C', outNo: '7C2355', retNo: '7C2356', outDep: '20:35', outArr: '00:35', outNextDay: true, retDep: '01:35', retArr: '09:10', durationText: '6시간 00분' },
  ],

  // 13. 인천(ICN) <-> 방콕 수완나품(BKK)
  'ICN-BKK': [
    { airlineCode: 'KE', outNo: 'KE657', retNo: 'KE658', outDep: '09:05', outArr: '13:00', retDep: '21:45', retArr: '05:05', retNextDay: true, durationText: '5시간 55분' },
    { airlineCode: 'TG', outNo: 'TG659', retNo: 'TG658', outDep: '09:35', outArr: '13:30', retDep: '23:10', retArr: '06:35', retNextDay: true, durationText: '5시간 55분' },
    { airlineCode: 'YP', outNo: 'YP601', retNo: 'YP602', outDep: '17:10', outArr: '21:10', retDep: '22:45', retArr: '06:25', retNextDay: true, durationText: '6시간 00분' },
    { airlineCode: 'ZE', outNo: 'ZE511', retNo: 'ZE512', outDep: '17:20', outArr: '21:25', retDep: '22:25', retArr: '06:10', retNextDay: true, durationText: '6시간 05분' },
    { airlineCode: 'OZ', outNo: 'OZ741', retNo: 'OZ742', outDep: '18:05', outArr: '22:00', retDep: '23:20', retArr: '06:55', retNextDay: true, durationText: '5시간 55분' },
    { airlineCode: 'TW', outNo: 'TW101', retNo: 'TW102', outDep: '19:25', outArr: '23:40', retDep: '00:55', retArr: '08:35', durationText: '6시간 15분' },
    { airlineCode: '7C', outNo: '7C2201', retNo: '7C2202', outDep: '19:30', outArr: '23:40', retDep: '01:00', retArr: '08:40', durationText: '6시간 10분' },
    { airlineCode: 'LJ', outNo: 'LJ001', retNo: 'LJ002', outDep: '19:50', outArr: '23:55', retDep: '01:10', retArr: '08:35', durationText: '6시간 05분' },
    { airlineCode: '7C', outNo: '7C2205', retNo: '7C2206', outDep: '21:10', outArr: '01:25', outNextDay: true, retDep: '02:25', retArr: '10:05', durationText: '6시간 15분' },
  ],

  // 14. 인천(ICN) <-> 치앙마이(CNX)
  'ICN-CNX': [
    { airlineCode: '7C', outNo: '7C2251', retNo: '7C2252', outDep: '16:50', outArr: '21:10', retDep: '22:10', retArr: '05:45', retNextDay: true, durationText: '6시간 20분' },
    { airlineCode: 'LJ', outNo: 'LJ015', retNo: 'LJ016', outDep: '17:20', outArr: '21:30', retDep: '22:40', retArr: '06:05', retNextDay: true, durationText: '6시간 10분' },
    { airlineCode: 'KE', outNo: 'KE667', retNo: 'KE668', outDep: '18:00', outArr: '22:15', retDep: '23:30', retArr: '06:40', retNextDay: true, durationText: '6시간 15분' },
    { airlineCode: 'ZE', outNo: 'ZE517', retNo: 'ZE518', outDep: '18:20', outArr: '22:30', retDep: '23:30', retArr: '06:50', retNextDay: true, durationText: '6시간 10분' },
    { airlineCode: 'OZ', outNo: 'OZ765', retNo: 'OZ766', outDep: '19:25', outArr: '23:30', retDep: '00:30', retArr: '07:50', durationText: '6시간 05분' },
  ],

  // 15. 인천(ICN) <-> 타이베이 타오위안(TPE)
  'ICN-TPE': [
    { airlineCode: 'KE', outNo: 'KE185', retNo: 'KE186', outDep: '09:00', outArr: '10:35', retDep: '11:45', retArr: '15:10', durationText: '2시간 35분' },
    { airlineCode: 'LJ', outNo: 'LJ731', retNo: 'LJ732', outDep: '09:40', outArr: '11:15', retDep: '12:25', retArr: '15:50', durationText: '2시간 35분' },
    { airlineCode: 'OZ', outNo: 'OZ711', retNo: 'OZ712', outDep: '09:50', outArr: '11:30', retDep: '12:55', retArr: '16:30', durationText: '2시간 40분' },
    { airlineCode: '7C', outNo: '7C6101', retNo: '7C6102', outDep: '10:30', outArr: '12:15', retDep: '13:15', retArr: '16:50', durationText: '2시간 45분' },
    { airlineCode: 'CI', outNo: 'CI161', retNo: 'CI160', outDep: '12:25', outArr: '14:10', retDep: '07:45', retArr: '11:10', durationText: '2시간 45분' },
    { airlineCode: 'BR', outNo: 'BR159', retNo: 'BR160', outDep: '19:45', outArr: '21:20', retDep: '15:15', retArr: '18:45', durationText: '2시간 35분' },
    { airlineCode: 'ZE', outNo: 'ZE881', retNo: 'ZE882', outDep: '22:30', outArr: '00:10', outNextDay: true, retDep: '02:00', retArr: '05:35', durationText: '2시간 40분' },
  ],

  // 16. 인천(ICN) <-> 싱가포르(SIN)
  'ICN-SIN': [
    { airlineCode: 'SQ', outNo: 'SQ607', retNo: 'SQ608', outDep: '09:00', outArr: '14:30', retDep: '00:10', retArr: '07:45', durationText: '6시간 30분' },
    { airlineCode: 'TW', outNo: 'TW171', retNo: 'TW172', outDep: '13:05', outArr: '18:45', retDep: '20:45', retArr: '04:20', retNextDay: true, durationText: '6시간 40분' },
    { airlineCode: 'KE', outNo: 'KE643', retNo: 'KE644', outDep: '14:25', outArr: '20:10', retDep: '22:30', retArr: '05:55', retNextDay: true, durationText: '6시간 45분' },
    { airlineCode: 'OZ', outNo: 'OZ751', retNo: 'OZ752', outDep: '16:10', outArr: '21:30', retDep: '22:50', retArr: '06:20', retNextDay: true, durationText: '6시간 20분' },
    { airlineCode: 'KE', outNo: 'KE645', retNo: 'KE646', outDep: '18:35', outArr: '00:10', outNextDay: true, retDep: '01:30', retArr: '08:50', durationText: '6시간 35분' },
    { airlineCode: 'TR', outNo: 'TR841', retNo: 'TR840', outDep: '22:35', outArr: '04:05', outNextDay: true, retDep: '09:10', retArr: '16:40', durationText: '6시간 30분' },
  ],

  // 17. 인천(ICN) <-> 발리(DPS)
  'ICN-DPS': [
    { airlineCode: 'GA', outNo: 'GA871', retNo: 'GA870', outDep: '11:25', outArr: '17:30', retDep: '01:15', retArr: '09:15', durationText: '7시간 05분' },
    { airlineCode: '7C', outNo: '7C5301', retNo: '7C5302', outDep: '15:40', outArr: '21:50', retDep: '23:05', retArr: '07:10', retNextDay: true, durationText: '7시간 10분' },
    { airlineCode: 'KE', outNo: 'KE629', retNo: 'KE630', outDep: '17:40', outArr: '23:55', retDep: '01:10', retArr: '09:15', durationText: '7시간 15분' },
    { airlineCode: 'KE', outNo: 'KE633', retNo: 'KE634', outDep: '19:00', outArr: '01:15', outNextDay: true, retDep: '02:35', retArr: '10:35', durationText: '7시간 15분' },
  ],

  // 18. 인천(ICN) <-> 세부(CEB) & 보홀(TAG)
  'ICN-CEB': [
    { airlineCode: 'PR', outNo: 'PR485', retNo: 'PR484', outDep: '08:15', outArr: '11:55', retDep: '01:05', retArr: '06:45', durationText: '4시간 40분' },
    { airlineCode: 'TW', outNo: 'TW145', retNo: 'TW146', outDep: '08:25', outArr: '12:05', retDep: '13:05', retArr: '18:45', durationText: '4시간 40분' },
    { airlineCode: 'LJ', outNo: 'LJ043', retNo: 'LJ044', outDep: '19:45', outArr: '23:25', retDep: '01:05', retArr: '06:40', durationText: '4시간 40분' },
    { airlineCode: '7C', outNo: '7C2405', retNo: '7C2406', outDep: '21:20', outArr: '01:00', outNextDay: true, retDep: '02:00', retArr: '07:40', durationText: '4시간 40분' },
    { airlineCode: '5J', outNo: '5J129', retNo: '5J128', outDep: '21:55', outArr: '01:40', outNextDay: true, retDep: '15:10', retArr: '20:55', durationText: '4시간 45분' },
  ],

  // 19. 인천(ICN) <-> 괌(GUM)
  'ICN-GUM': [
    { airlineCode: 'KE', outNo: 'KE421', retNo: 'KE422', outDep: '09:15', outArr: '14:45', retDep: '16:15', retArr: '19:55', durationText: '4시간 30분' },
    { airlineCode: 'LJ', outNo: 'LJ913', retNo: 'LJ914', outDep: '09:45', outArr: '15:15', retDep: '16:30', retArr: '20:15', durationText: '4시간 30분' },
    { airlineCode: '7C', outNo: '7C3102', retNo: '7C3101', outDep: '10:40', outArr: '16:05', retDep: '17:05', retArr: '20:55', durationText: '4시간 25분' },
    { airlineCode: 'TW', outNo: 'TW301', retNo: 'TW302', outDep: '11:00', outArr: '16:30', retDep: '17:30', retArr: '21:15', durationText: '4시간 30분' },
    { airlineCode: 'KE', outNo: 'KE423', retNo: 'KE424', outDep: '19:35', outArr: '01:00', outNextDay: true, retDep: '02:30', retArr: '06:15', durationText: '4시간 25분' },
    { airlineCode: '7C', outNo: '7C3106', retNo: '7C3105', outDep: '20:20', outArr: '01:45', outNextDay: true, retDep: '02:50', retArr: '06:40', durationText: '4시간 25분' },
  ],

  // 20. 인천(ICN) <-> 하와이 호놀룰루(HNL)
  'ICN-HNL': [
    { airlineCode: 'OZ', outNo: 'OZ232', retNo: 'OZ231', outDep: '20:20', outArr: '09:30', retDep: '11:10', retArr: '16:40', retNextDay: true, durationText: '8시간 10분' },
    { airlineCode: 'KE', outNo: 'KE053', retNo: 'KE054', outDep: '20:35', outArr: '09:30', retDep: '11:40', retArr: '17:20', retNextDay: true, durationText: '7시간 55분' },
    { airlineCode: 'HA', outNo: 'HA460', retNo: 'HA459', outDep: '21:25', outArr: '10:30', retDep: '13:10', retArr: '19:05', retNextDay: true, durationText: '8시간 05분' },
    { airlineCode: 'YP', outNo: 'YP105', retNo: 'YP106', outDep: '22:30', outArr: '11:50', retDep: '14:10', retArr: '19:50', retNextDay: true, durationText: '8시간 20분' },
  ],

  // 21. 김포(GMP) <-> 제주(CJU)
  'GMP-CJU': [
    { airlineCode: '7C', outNo: '7C101', retNo: '7C102', outDep: '06:15', outArr: '07:25', retDep: '08:05', retArr: '09:15', durationText: '1시간 10분' },
    { airlineCode: 'TW', outNo: 'TW701', retNo: 'TW702', outDep: '06:30', outArr: '07:40', retDep: '08:25', retArr: '09:35', durationText: '1시간 10분' },
    { airlineCode: 'LJ', outNo: 'LJ501', retNo: 'LJ502', outDep: '06:45', outArr: '07:55', retDep: '08:40', retArr: '09:50', durationText: '1시간 10분' },
    { airlineCode: 'ZE', outNo: 'ZE203', retNo: 'ZE204', outDep: '07:05', outArr: '08:15', retDep: '09:00', retArr: '10:10', durationText: '1시간 10분' },
    { airlineCode: 'KE', outNo: 'KE1205', retNo: 'KE1236', outDep: '07:35', outArr: '08:45', retDep: '16:00', retArr: '17:10', durationText: '1시간 10분' },
    { airlineCode: 'OZ', outNo: 'OZ8909', retNo: 'OZ8964', outDep: '08:15', outArr: '09:25', retDep: '17:15', retArr: '18:25', durationText: '1시간 10분' },
    { airlineCode: 'BX', outNo: 'BX8013', retNo: 'BX8024', outDep: '09:35', outArr: '10:45', retDep: '18:00', retArr: '19:10', durationText: '1시간 10분' },
    { airlineCode: '7C', outNo: '7C115', retNo: '7C136', outDep: '11:20', outArr: '12:30', retDep: '18:40', retArr: '19:50', durationText: '1시간 10분' },
    { airlineCode: 'LJ', outNo: 'LJ519', retNo: 'LJ532', outDep: '13:45', outArr: '14:55', retDep: '19:45', retArr: '20:55', durationText: '1시간 10분' },
    { airlineCode: 'TW', outNo: 'TW727', retNo: 'TW742', outDep: '15:10', outArr: '16:20', retDep: '20:30', retArr: '21:40', durationText: '1시간 10분' },
  ],
};

/**
 * 공항 문자열에서 3자리 IATA 코드를 추출 (예: '인천국제공항 (ICN)' -> 'ICN')
 */
export function extractIataCode(airportStr?: string): string {
  if (!airportStr) return '';
  const match = airportStr.toUpperCase().match(/\(([A-Z]{3})\)/);
  if (match) return match[1];

  const trimmed = airportStr.trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(trimmed)) return trimmed;

  const found = POPULAR_AIRPORTS.find(
    (a) =>
      airportStr.includes(a.nameKo) ||
      airportStr.toLowerCase().includes(a.city.split(' ')[0].toLowerCase()) ||
      airportStr.toUpperCase().includes(a.code)
  );
  return found ? found.code : '';
}

function getAirportDisplayByCode(code: string, fallbackStr?: string): string {
  const found = POPULAR_AIRPORTS.find((a) => a.code === code);
  if (found) return `${found.nameKo} (${found.code})`;
  return fallbackStr || code;
}

/**
 * DB에 직접 정의되지 않은 공항 조합(예: 청주->다낭, 김해->오사카, 인천->로마 등)도
 * 지역 특성에 맞는 다양한 항공사 스케줄을 즉석에서 생성하여 모든 노선이 쫙 뜨도록 처리
 */
function buildDynamicRouteTimetable(depCode: string, arrCode: string): RouteSlotTemplate[] {
  const foreignCode = ['ICN', 'GMP', 'PUS', 'CJJ', 'TAE', 'CJU'].includes(depCode)
    ? arrCode
    : depCode;

  // 일본 노선
  if (['FUK', 'NRT', 'HND', 'KIX', 'CTS', 'OKA', 'NGO'].includes(foreignCode)) {
    return [
      { airlineCode: '7C', outNo: '7C1352', retNo: '7C1351', outDep: '07:30', outArr: '09:20', retDep: '10:20', retArr: '12:15', durationText: '1시간 50분' },
      { airlineCode: 'LJ', outNo: 'LJ241', retNo: 'LJ242', outDep: '08:15', outArr: '10:05', retDep: '11:05', retArr: '13:00', durationText: '1시간 50분' },
      { airlineCode: 'BX', outNo: 'BX124', retNo: 'BX123', outDep: '08:35', outArr: '10:20', retDep: '11:20', retArr: '13:10', durationText: '1시간 45분' },
      { airlineCode: 'TW', outNo: 'TW261', retNo: 'TW262', outDep: '09:30', outArr: '11:20', retDep: '12:20', retArr: '14:15', durationText: '1시간 50분' },
      { airlineCode: 'KE', outNo: 'KE731', retNo: 'KE732', outDep: '10:15', outArr: '12:05', retDep: '13:15', retArr: '15:10', durationText: '1시간 50분' },
      { airlineCode: 'OZ', outNo: 'OZ142', retNo: 'OZ141', outDep: '12:40', outArr: '14:30', retDep: '15:40', retArr: '17:35', durationText: '1시간 50분' },
      { airlineCode: 'ZE', outNo: 'ZE651', retNo: 'ZE652', outDep: '15:20', outArr: '17:10', retDep: '18:10', retArr: '20:05', durationText: '1시간 50분' },
    ];
  }

  // 동남아 / 중화권 노선 (호치민, 달랏, 푸켓, 보홀, 코타키나발루, 홍콩, 마카오, 가오슝 등)
  if (['SGN', 'DLI', 'DMK', 'HKT', 'TAG', 'BKI', 'HKG', 'MFM', 'KHH', 'TSA'].includes(foreignCode)) {
    return [
      { airlineCode: '7C', outNo: '7C2501', retNo: '7C2502', outDep: '08:30', outArr: '12:10', retDep: '13:10', retArr: '20:10', durationText: '5시간 00분' },
      { airlineCode: 'LJ', outNo: 'LJ071', retNo: 'LJ072', outDep: '10:15', outArr: '13:55', retDep: '15:00', retArr: '22:00', durationText: '5시간 00분' },
      { airlineCode: 'TW', outNo: 'TW131', retNo: 'TW132', outDep: '13:30', outArr: '17:10', retDep: '18:15', retArr: '01:10', retNextDay: true, durationText: '5시간 00분' },
      { airlineCode: 'KE', outNo: 'KE475', retNo: 'KE476', outDep: '18:15', outArr: '22:00', retDep: '23:20', retArr: '06:10', retNextDay: true, durationText: '5시간 10분' },
      { airlineCode: 'OZ', outNo: 'OZ735', retNo: 'OZ736', outDep: '19:15', outArr: '23:00', retDep: '00:10', retArr: '07:00', durationText: '5시간 10분' },
      { airlineCode: 'ZE', outNo: 'ZE551', retNo: 'ZE552', outDep: '20:40', outArr: '00:25', outNextDay: true, retDep: '01:30', retArr: '08:20', durationText: '5시간 15분' },
    ];
  }

  // 유럽 / 미주 / 호주 장거리 노선 (파리, 런던, 로마, 바르셀로나, 프랑크푸르트, LA, 뉴욕, 시드니 등)
  return [
    { airlineCode: 'KE', outNo: 'KE901', retNo: 'KE902', outDep: '11:30', outArr: '17:50', retDep: '20:30', retArr: '15:30', retNextDay: true, durationText: '13시간 20분' },
    { airlineCode: 'OZ', outNo: 'OZ501', retNo: 'OZ502', outDep: '12:15', outArr: '18:30', retDep: '20:00', retArr: '15:05', retNextDay: true, durationText: '13시간 15분' },
    { airlineCode: 'YP', outNo: 'YP201', retNo: 'YP202', outDep: '13:20', outArr: '19:40', retDep: '21:30', retArr: '16:40', retNextDay: true, durationText: '13시간 20분' },
    { airlineCode: 'TW', outNo: 'TW401', retNo: 'TW402', outDep: '11:05', outArr: '17:35', retDep: '20:15', retArr: '15:25', retNextDay: true, durationText: '13시간 30분' },
    { airlineCode: 'AF', outNo: 'AF267', retNo: 'AF264', outDep: '12:25', outArr: '18:45', retDep: '19:45', retArr: '14:50', retNextDay: true, durationText: '13시간 20분' },
    { airlineCode: 'LH', outNo: 'LH713', retNo: 'LH712', outDep: '13:50', outArr: '19:15', retDep: '18:10', retArr: '12:35', retNextDay: true, durationText: '12시간 25분' },
  ];
}

/**
 * 출발 공항과 도착 공항에 따른 전체 운항 항공편 목록 반환
 */
export function getFlightsForRoute(
  depAirportStr: string,
  arrAirportStr: string,
  filterQuery: string = '',
  airlineFilter: string = 'ALL'
): RealFlightSchedule[] {
  const depCode = extractIataCode(depAirportStr);
  const arrCode = extractIataCode(arrAirportStr);

  if (!depCode || !arrCode || depCode === arrCode) {
    return [];
  }

  const directKey = `${depCode}-${arrCode}`;
  const reverseKey = `${arrCode}-${depCode}`;

  const isOutboundDirection = Boolean(ROUTE_SCHEDULES_DB[directKey]) ||
    (['ICN', 'GMP', 'PUS', 'CJJ', 'TAE'].includes(depCode) && depCode !== arrCode);

  const templates: RouteSlotTemplate[] =
    ROUTE_SCHEDULES_DB[directKey] ||
    ROUTE_SCHEDULES_DB[reverseKey] ||
    buildDynamicRouteTimetable(depCode, arrCode);

  const useOutboundSlot = Boolean(ROUTE_SCHEDULES_DB[directKey]) ||
    (!ROUTE_SCHEDULES_DB[reverseKey] && isOutboundDirection);

  const depDisplay = getAirportDisplayByCode(depCode, depAirportStr);
  const arrDisplay = getAirportDisplayByCode(arrCode, arrAirportStr);

  let schedules: RealFlightSchedule[] = templates.map((tpl) => {
    const meta = AIRLINE_META[tpl.airlineCode] || {
      name: `${tpl.airlineCode} 항공`,
      color: '#1B2A4A',
      defaultTerminal: '제1여객터미널',
    };
    const flightNo = useOutboundSlot ? tpl.outNo : tpl.retNo;
    const pairedNo = useOutboundSlot ? tpl.retNo : tpl.outNo;
    const depTime = useOutboundSlot ? tpl.outDep : tpl.retDep;
    const arrTime = useOutboundSlot ? tpl.outArr : tpl.retArr;
    const nextDay = Boolean(useOutboundSlot ? tpl.outNextDay : tpl.retNextDay);

    return {
      id: `${depCode}_${arrCode}_${flightNo}`,
      flightNumber: flightNo,
      airline: meta.name,
      airlineCode: tpl.airlineCode,
      airlineColor: meta.color,
      departureAirport: depDisplay,
      departureCode: depCode,
      arrivalAirport: arrDisplay,
      arrivalCode: arrCode,
      departureTime: depTime,
      arrivalTime: arrTime,
      durationText: tpl.durationText,
      arrivalNextDay: nextDay,
      terminal: tpl.terminal || meta.defaultTerminal,
      direction: useOutboundSlot ? 'outbound' : 'return',
      pairedFlightNumber: pairedNo,
    };
  });

  // 출발 시간 순 정렬
  schedules.sort((a, b) => a.departureTime.localeCompare(b.departureTime));

  // 항공사 필터
  if (airlineFilter && airlineFilter !== 'ALL') {
    schedules = schedules.filter((s) => s.airline === airlineFilter || s.airlineCode === airlineFilter);
  }

  // 키워드/편명 필터
  const q = filterQuery.trim().toLowerCase();
  if (q) {
    schedules = schedules.filter(
      (s) =>
        s.flightNumber.toLowerCase().includes(q) ||
        s.airline.toLowerCase().includes(q) ||
        s.departureTime.includes(q) ||
        s.arrivalTime.includes(q)
    );
  }

  return schedules;
}

/**
 * 선택한 항공편의 왕복 짝꿍 항공편 반환 (가는 편 선택 시 오는 편 자동 세팅용)
 */
export function findPairedReturnFlight(
  selectedFlight: RealFlightSchedule
): RealFlightSchedule | null {
  if (!selectedFlight.pairedFlightNumber) return null;
  const returnList = getFlightsForRoute(
    selectedFlight.arrivalAirport,
    selectedFlight.departureAirport
  );
  return (
    returnList.find(
      (f) => f.flightNumber.toUpperCase() === selectedFlight.pairedFlightNumber!.toUpperCase()
    ) || null
  );
}
