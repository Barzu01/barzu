import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { carAPI, brandsAPI } from '../../services/api';
import { REGIONS } from '../../constants/carData';
import { BODY_TYPES, CAR_FEATURES, ENGINE_VOLUMES, COLORS } from '../../constants/theme';
import SearchableSelect from '../../components/SearchableSelect';

interface Brand {
  name: string;
  make_id: number;
}

interface CarModel {
  name: string;
  model_id: number;
}

// Все модели Mercedes-Benz
const MERCEDES_MODELS: CarModel[] = [
  // A-Class
  { name: 'A-Class', model_id: 1 },
  { name: 'A 160', model_id: 2 },
  { name: 'A 180', model_id: 3 },
  { name: 'A 200', model_id: 4 },
  { name: 'A 220', model_id: 5 },
  { name: 'A 250', model_id: 6 },
  { name: 'A 35 AMG', model_id: 7 },
  { name: 'A 45 AMG', model_id: 8 },
  // B-Class
  { name: 'B-Class', model_id: 10 },
  { name: 'B 150', model_id: 11 },
  { name: 'B 170', model_id: 12 },
  { name: 'B 180', model_id: 13 },
  { name: 'B 200', model_id: 14 },
  { name: 'B 220', model_id: 15 },
  { name: 'B 250', model_id: 16 },
  // C-Class
  { name: 'C-Class', model_id: 20 },
  { name: 'C 160', model_id: 21 },
  { name: 'C 180', model_id: 22 },
  { name: 'C 200', model_id: 23 },
  { name: 'C 220', model_id: 24 },
  { name: 'C 230', model_id: 25 },
  { name: 'C 240', model_id: 26 },
  { name: 'C 250', model_id: 27 },
  { name: 'C 280', model_id: 28 },
  { name: 'C 300', model_id: 29 },
  { name: 'C 320', model_id: 30 },
  { name: 'C 350', model_id: 31 },
  { name: 'C 400', model_id: 32 },
  { name: 'C 43 AMG', model_id: 33 },
  { name: 'C 55 AMG', model_id: 34 },
  { name: 'C 63 AMG', model_id: 35 },
  // CLA-Class
  { name: 'CLA', model_id: 40 },
  { name: 'CLA 180', model_id: 41 },
  { name: 'CLA 200', model_id: 42 },
  { name: 'CLA 220', model_id: 43 },
  { name: 'CLA 250', model_id: 44 },
  { name: 'CLA 35 AMG', model_id: 45 },
  { name: 'CLA 45 AMG', model_id: 46 },
  // CLS-Class
  { name: 'CLS', model_id: 50 },
  { name: 'CLS 220', model_id: 51 },
  { name: 'CLS 250', model_id: 52 },
  { name: 'CLS 300', model_id: 53 },
  { name: 'CLS 350', model_id: 54 },
  { name: 'CLS 400', model_id: 55 },
  { name: 'CLS 450', model_id: 56 },
  { name: 'CLS 500', model_id: 57 },
  { name: 'CLS 53 AMG', model_id: 58 },
  { name: 'CLS 55 AMG', model_id: 59 },
  { name: 'CLS 63 AMG', model_id: 60 },
  // E-Class
  { name: 'E-Class', model_id: 70 },
  { name: 'E 200', model_id: 71 },
  { name: 'E 220', model_id: 72 },
  { name: 'E 230', model_id: 73 },
  { name: 'E 240', model_id: 74 },
  { name: 'E 250', model_id: 75 },
  { name: 'E 260', model_id: 76 },
  { name: 'E 280', model_id: 77 },
  { name: 'E 300', model_id: 78 },
  { name: 'E 320', model_id: 79 },
  { name: 'E 350', model_id: 80 },
  { name: 'E 400', model_id: 81 },
  { name: 'E 420', model_id: 82 },
  { name: 'E 430', model_id: 83 },
  { name: 'E 450', model_id: 84 },
  { name: 'E 500', model_id: 85 },
  { name: 'E 550', model_id: 86 },
  { name: 'E 43 AMG', model_id: 87 },
  { name: 'E 53 AMG', model_id: 88 },
  { name: 'E 55 AMG', model_id: 89 },
  { name: 'E 63 AMG', model_id: 90 },
  // S-Class
  { name: 'S-Class', model_id: 100 },
  { name: 'S 280', model_id: 101 },
  { name: 'S 300', model_id: 102 },
  { name: 'S 320', model_id: 103 },
  { name: 'S 350', model_id: 104 },
  { name: 'S 400', model_id: 105 },
  { name: 'S 420', model_id: 106 },
  { name: 'S 430', model_id: 107 },
  { name: 'S 450', model_id: 108 },
  { name: 'S 500', model_id: 109 },
  { name: 'S 550', model_id: 110 },
  { name: 'S 560', model_id: 111 },
  { name: 'S 580', model_id: 112 },
  { name: 'S 600', model_id: 113 },
  { name: 'S 63 AMG', model_id: 114 },
  { name: 'S 65 AMG', model_id: 115 },
  // G-Class
  { name: 'G-Class', model_id: 120 },
  { name: 'G 230', model_id: 121 },
  { name: 'G 270', model_id: 122 },
  { name: 'G 280', model_id: 123 },
  { name: 'G 290', model_id: 124 },
  { name: 'G 300', model_id: 125 },
  { name: 'G 320', model_id: 126 },
  { name: 'G 350', model_id: 127 },
  { name: 'G 400', model_id: 128 },
  { name: 'G 500', model_id: 129 },
  { name: 'G 550', model_id: 130 },
  { name: 'G 55 AMG', model_id: 131 },
  { name: 'G 63 AMG', model_id: 132 },
  { name: 'G 65 AMG', model_id: 133 },
  // GLA-Class
  { name: 'GLA', model_id: 140 },
  { name: 'GLA 180', model_id: 141 },
  { name: 'GLA 200', model_id: 142 },
  { name: 'GLA 220', model_id: 143 },
  { name: 'GLA 250', model_id: 144 },
  { name: 'GLA 35 AMG', model_id: 145 },
  { name: 'GLA 45 AMG', model_id: 146 },
  // GLB-Class
  { name: 'GLB', model_id: 150 },
  { name: 'GLB 180', model_id: 151 },
  { name: 'GLB 200', model_id: 152 },
  { name: 'GLB 220', model_id: 153 },
  { name: 'GLB 250', model_id: 154 },
  { name: 'GLB 35 AMG', model_id: 155 },
  // GLC-Class
  { name: 'GLC', model_id: 160 },
  { name: 'GLC 200', model_id: 161 },
  { name: 'GLC 220', model_id: 162 },
  { name: 'GLC 250', model_id: 163 },
  { name: 'GLC 300', model_id: 164 },
  { name: 'GLC 350', model_id: 165 },
  { name: 'GLC 400', model_id: 166 },
  { name: 'GLC 43 AMG', model_id: 167 },
  { name: 'GLC 63 AMG', model_id: 168 },
  { name: 'GLC Coupe', model_id: 169 },
  // GLE-Class
  { name: 'GLE', model_id: 170 },
  { name: 'GLE 250', model_id: 171 },
  { name: 'GLE 300', model_id: 172 },
  { name: 'GLE 350', model_id: 173 },
  { name: 'GLE 400', model_id: 174 },
  { name: 'GLE 450', model_id: 175 },
  { name: 'GLE 500', model_id: 176 },
  { name: 'GLE 53 AMG', model_id: 177 },
  { name: 'GLE 63 AMG', model_id: 178 },
  { name: 'GLE Coupe', model_id: 179 },
  // GLS-Class
  { name: 'GLS', model_id: 180 },
  { name: 'GLS 350', model_id: 181 },
  { name: 'GLS 400', model_id: 182 },
  { name: 'GLS 450', model_id: 183 },
  { name: 'GLS 500', model_id: 184 },
  { name: 'GLS 550', model_id: 185 },
  { name: 'GLS 580', model_id: 186 },
  { name: 'GLS 600 Maybach', model_id: 187 },
  { name: 'GLS 63 AMG', model_id: 188 },
  // ML-Class (старые)
  { name: 'ML-Class', model_id: 190 },
  { name: 'ML 230', model_id: 191 },
  { name: 'ML 250', model_id: 192 },
  { name: 'ML 270', model_id: 193 },
  { name: 'ML 280', model_id: 194 },
  { name: 'ML 300', model_id: 195 },
  { name: 'ML 320', model_id: 196 },
  { name: 'ML 350', model_id: 197 },
  { name: 'ML 400', model_id: 198 },
  { name: 'ML 430', model_id: 199 },
  { name: 'ML 450', model_id: 200 },
  { name: 'ML 500', model_id: 201 },
  { name: 'ML 550', model_id: 202 },
  { name: 'ML 55 AMG', model_id: 203 },
  { name: 'ML 63 AMG', model_id: 204 },
  // GL-Class (старые)
  { name: 'GL-Class', model_id: 210 },
  { name: 'GL 320', model_id: 211 },
  { name: 'GL 350', model_id: 212 },
  { name: 'GL 420', model_id: 213 },
  { name: 'GL 450', model_id: 214 },
  { name: 'GL 500', model_id: 215 },
  { name: 'GL 550', model_id: 216 },
  { name: 'GL 63 AMG', model_id: 217 },
  // GLK-Class
  { name: 'GLK', model_id: 220 },
  { name: 'GLK 200', model_id: 221 },
  { name: 'GLK 220', model_id: 222 },
  { name: 'GLK 250', model_id: 223 },
  { name: 'GLK 280', model_id: 224 },
  { name: 'GLK 300', model_id: 225 },
  { name: 'GLK 320', model_id: 226 },
  { name: 'GLK 350', model_id: 227 },
  // SL-Class
  { name: 'SL', model_id: 230 },
  { name: 'SL 280', model_id: 231 },
  { name: 'SL 300', model_id: 232 },
  { name: 'SL 320', model_id: 233 },
  { name: 'SL 350', model_id: 234 },
  { name: 'SL 380', model_id: 235 },
  { name: 'SL 400', model_id: 236 },
  { name: 'SL 450', model_id: 237 },
  { name: 'SL 500', model_id: 238 },
  { name: 'SL 550', model_id: 239 },
  { name: 'SL 55 AMG', model_id: 240 },
  { name: 'SL 63 AMG', model_id: 241 },
  { name: 'SL 65 AMG', model_id: 242 },
  // SLC/SLK-Class
  { name: 'SLK', model_id: 250 },
  { name: 'SLK 200', model_id: 251 },
  { name: 'SLK 230', model_id: 252 },
  { name: 'SLK 250', model_id: 253 },
  { name: 'SLK 280', model_id: 254 },
  { name: 'SLK 300', model_id: 255 },
  { name: 'SLK 320', model_id: 256 },
  { name: 'SLK 350', model_id: 257 },
  { name: 'SLK 55 AMG', model_id: 258 },
  { name: 'SLC 180', model_id: 259 },
  { name: 'SLC 200', model_id: 260 },
  { name: 'SLC 300', model_id: 261 },
  { name: 'SLC 43 AMG', model_id: 262 },
  // AMG GT
  { name: 'AMG GT', model_id: 270 },
  { name: 'AMG GT S', model_id: 271 },
  { name: 'AMG GT C', model_id: 272 },
  { name: 'AMG GT R', model_id: 273 },
  { name: 'AMG GT 43', model_id: 274 },
  { name: 'AMG GT 53', model_id: 275 },
  { name: 'AMG GT 63', model_id: 276 },
  { name: 'AMG GT 63 S', model_id: 277 },
  // EQ Electric
  { name: 'EQA', model_id: 280 },
  { name: 'EQA 250', model_id: 281 },
  { name: 'EQA 300', model_id: 282 },
  { name: 'EQA 350', model_id: 283 },
  { name: 'EQB', model_id: 284 },
  { name: 'EQB 250', model_id: 285 },
  { name: 'EQB 300', model_id: 286 },
  { name: 'EQB 350', model_id: 287 },
  { name: 'EQC', model_id: 288 },
  { name: 'EQC 400', model_id: 289 },
  { name: 'EQE', model_id: 290 },
  { name: 'EQE 300', model_id: 291 },
  { name: 'EQE 350', model_id: 292 },
  { name: 'EQE 500', model_id: 293 },
  { name: 'EQE 43 AMG', model_id: 294 },
  { name: 'EQE 53 AMG', model_id: 295 },
  { name: 'EQE SUV', model_id: 296 },
  { name: 'EQS', model_id: 297 },
  { name: 'EQS 450', model_id: 298 },
  { name: 'EQS 500', model_id: 299 },
  { name: 'EQS 580', model_id: 300 },
  { name: 'EQS 53 AMG', model_id: 301 },
  { name: 'EQS SUV', model_id: 302 },
  { name: 'EQV', model_id: 303 },
  // Maybach
  { name: 'Maybach S-Class', model_id: 310 },
  { name: 'Maybach S 560', model_id: 311 },
  { name: 'Maybach S 580', model_id: 312 },
  { name: 'Maybach S 600', model_id: 313 },
  { name: 'Maybach S 650', model_id: 314 },
  { name: 'Maybach S 680', model_id: 315 },
  // V-Class / Vito / Viano
  { name: 'V-Class', model_id: 320 },
  { name: 'V 200', model_id: 321 },
  { name: 'V 220', model_id: 322 },
  { name: 'V 250', model_id: 323 },
  { name: 'V 300', model_id: 324 },
  { name: 'Vito', model_id: 325 },
  { name: 'Viano', model_id: 326 },
  // Sprinter
  { name: 'Sprinter', model_id: 330 },
  // Vintage / Classic
  { name: 'W123', model_id: 340 },
  { name: 'W124', model_id: 341 },
  { name: 'W126', model_id: 342 },
  { name: 'W140', model_id: 343 },
  { name: 'W201 (190)', model_id: 344 },
  { name: 'W202', model_id: 345 },
  { name: 'W203', model_id: 346 },
  { name: 'W204', model_id: 347 },
  { name: 'W205', model_id: 348 },
  { name: 'W206', model_id: 349 },
  { name: 'W210', model_id: 350 },
  { name: 'W211', model_id: 351 },
  { name: 'W212', model_id: 352 },
  { name: 'W213', model_id: 353 },
  { name: 'W214', model_id: 354 },
  { name: 'W220', model_id: 355 },
  { name: 'W221', model_id: 356 },
  { name: 'W222', model_id: 357 },
  { name: 'W223', model_id: 358 },
  // R-Class
  { name: 'R-Class', model_id: 360 },
  { name: 'R 280', model_id: 361 },
  { name: 'R 300', model_id: 362 },
  { name: 'R 320', model_id: 363 },
  { name: 'R 350', model_id: 364 },
  { name: 'R 500', model_id: 365 },
  { name: 'R 63 AMG', model_id: 366 },
  // Другие
  { name: 'Другая модель', model_id: 999 },
];

// Все модели BMW
const BMW_MODELS: CarModel[] = [
  // 1 Series
  { name: '1 Series', model_id: 1001 },
  { name: '114i', model_id: 1002 },
  { name: '116i', model_id: 1003 },
  { name: '118i', model_id: 1004 },
  { name: '118d', model_id: 1005 },
  { name: '120i', model_id: 1006 },
  { name: '120d', model_id: 1007 },
  { name: '125i', model_id: 1008 },
  { name: '128ti', model_id: 1009 },
  { name: 'M135i', model_id: 1010 },
  { name: 'M140i', model_id: 1011 },
  // 2 Series
  { name: '2 Series', model_id: 1020 },
  { name: '218i', model_id: 1021 },
  { name: '218d', model_id: 1022 },
  { name: '220i', model_id: 1023 },
  { name: '220d', model_id: 1024 },
  { name: '225i', model_id: 1025 },
  { name: '228i', model_id: 1026 },
  { name: '230i', model_id: 1027 },
  { name: 'M235i', model_id: 1028 },
  { name: 'M240i', model_id: 1029 },
  { name: 'M2', model_id: 1030 },
  { name: 'M2 Competition', model_id: 1031 },
  { name: '2 Series Active Tourer', model_id: 1032 },
  { name: '2 Series Gran Coupe', model_id: 1033 },
  // 3 Series
  { name: '3 Series', model_id: 1040 },
  { name: '316i', model_id: 1041 },
  { name: '318i', model_id: 1042 },
  { name: '318d', model_id: 1043 },
  { name: '320i', model_id: 1044 },
  { name: '320d', model_id: 1045 },
  { name: '323i', model_id: 1046 },
  { name: '325i', model_id: 1047 },
  { name: '325d', model_id: 1048 },
  { name: '328i', model_id: 1049 },
  { name: '330i', model_id: 1050 },
  { name: '330d', model_id: 1051 },
  { name: '330e', model_id: 1052 },
  { name: '335i', model_id: 1053 },
  { name: '335d', model_id: 1054 },
  { name: '340i', model_id: 1055 },
  { name: 'M340i', model_id: 1056 },
  { name: 'M3', model_id: 1057 },
  { name: 'M3 Competition', model_id: 1058 },
  { name: '3 Series GT', model_id: 1059 },
  // 4 Series
  { name: '4 Series', model_id: 1070 },
  { name: '418i', model_id: 1071 },
  { name: '420i', model_id: 1072 },
  { name: '420d', model_id: 1073 },
  { name: '425i', model_id: 1074 },
  { name: '428i', model_id: 1075 },
  { name: '430i', model_id: 1076 },
  { name: '430d', model_id: 1077 },
  { name: '435i', model_id: 1078 },
  { name: '440i', model_id: 1079 },
  { name: 'M440i', model_id: 1080 },
  { name: 'M4', model_id: 1081 },
  { name: 'M4 Competition', model_id: 1082 },
  { name: '4 Series Gran Coupe', model_id: 1083 },
  // 5 Series
  { name: '5 Series', model_id: 1090 },
  { name: '518i', model_id: 1091 },
  { name: '520i', model_id: 1092 },
  { name: '520d', model_id: 1093 },
  { name: '523i', model_id: 1094 },
  { name: '525i', model_id: 1095 },
  { name: '525d', model_id: 1096 },
  { name: '528i', model_id: 1097 },
  { name: '530i', model_id: 1098 },
  { name: '530d', model_id: 1099 },
  { name: '530e', model_id: 1100 },
  { name: '535i', model_id: 1101 },
  { name: '535d', model_id: 1102 },
  { name: '540i', model_id: 1103 },
  { name: '540d', model_id: 1104 },
  { name: '545i', model_id: 1105 },
  { name: '550i', model_id: 1106 },
  { name: 'M550i', model_id: 1107 },
  { name: 'M5', model_id: 1108 },
  { name: 'M5 Competition', model_id: 1109 },
  { name: '5 Series GT', model_id: 1110 },
  // 6 Series
  { name: '6 Series', model_id: 1120 },
  { name: '630i', model_id: 1121 },
  { name: '640i', model_id: 1122 },
  { name: '640d', model_id: 1123 },
  { name: '645i', model_id: 1124 },
  { name: '650i', model_id: 1125 },
  { name: 'M6', model_id: 1126 },
  { name: '6 Series Gran Coupe', model_id: 1127 },
  { name: '6 Series Gran Turismo', model_id: 1128 },
  // 7 Series
  { name: '7 Series', model_id: 1140 },
  { name: '725d', model_id: 1141 },
  { name: '728i', model_id: 1142 },
  { name: '730i', model_id: 1143 },
  { name: '730d', model_id: 1144 },
  { name: '735i', model_id: 1145 },
  { name: '740i', model_id: 1146 },
  { name: '740d', model_id: 1147 },
  { name: '740e', model_id: 1148 },
  { name: '745i', model_id: 1149 },
  { name: '745e', model_id: 1150 },
  { name: '750i', model_id: 1151 },
  { name: '750d', model_id: 1152 },
  { name: '760i', model_id: 1153 },
  { name: 'M760i', model_id: 1154 },
  { name: 'Alpina B7', model_id: 1155 },
  // 8 Series
  { name: '8 Series', model_id: 1160 },
  { name: '840i', model_id: 1161 },
  { name: '840d', model_id: 1162 },
  { name: '850i', model_id: 1163 },
  { name: 'M850i', model_id: 1164 },
  { name: 'M8', model_id: 1165 },
  { name: 'M8 Competition', model_id: 1166 },
  { name: '8 Series Gran Coupe', model_id: 1167 },
  // X1
  { name: 'X1', model_id: 1180 },
  { name: 'X1 sDrive16i', model_id: 1181 },
  { name: 'X1 sDrive18i', model_id: 1182 },
  { name: 'X1 sDrive18d', model_id: 1183 },
  { name: 'X1 sDrive20i', model_id: 1184 },
  { name: 'X1 xDrive20i', model_id: 1185 },
  { name: 'X1 xDrive20d', model_id: 1186 },
  { name: 'X1 xDrive25i', model_id: 1187 },
  { name: 'X1 xDrive25e', model_id: 1188 },
  // X2
  { name: 'X2', model_id: 1190 },
  { name: 'X2 sDrive18i', model_id: 1191 },
  { name: 'X2 sDrive20i', model_id: 1192 },
  { name: 'X2 xDrive20i', model_id: 1193 },
  { name: 'X2 xDrive20d', model_id: 1194 },
  { name: 'X2 M35i', model_id: 1195 },
  // X3
  { name: 'X3', model_id: 1200 },
  { name: 'X3 sDrive18i', model_id: 1201 },
  { name: 'X3 xDrive20i', model_id: 1202 },
  { name: 'X3 xDrive20d', model_id: 1203 },
  { name: 'X3 xDrive25i', model_id: 1204 },
  { name: 'X3 xDrive28i', model_id: 1205 },
  { name: 'X3 xDrive30i', model_id: 1206 },
  { name: 'X3 xDrive30d', model_id: 1207 },
  { name: 'X3 xDrive30e', model_id: 1208 },
  { name: 'X3 xDrive35i', model_id: 1209 },
  { name: 'X3 M40i', model_id: 1210 },
  { name: 'X3 M', model_id: 1211 },
  { name: 'X3 M Competition', model_id: 1212 },
  // X4
  { name: 'X4', model_id: 1220 },
  { name: 'X4 xDrive20i', model_id: 1221 },
  { name: 'X4 xDrive20d', model_id: 1222 },
  { name: 'X4 xDrive28i', model_id: 1223 },
  { name: 'X4 xDrive30i', model_id: 1224 },
  { name: 'X4 xDrive30d', model_id: 1225 },
  { name: 'X4 xDrive35i', model_id: 1226 },
  { name: 'X4 M40i', model_id: 1227 },
  { name: 'X4 M', model_id: 1228 },
  { name: 'X4 M Competition', model_id: 1229 },
  // X5
  { name: 'X5', model_id: 1240 },
  { name: 'X5 sDrive25d', model_id: 1241 },
  { name: 'X5 xDrive25d', model_id: 1242 },
  { name: 'X5 xDrive30i', model_id: 1243 },
  { name: 'X5 xDrive30d', model_id: 1244 },
  { name: 'X5 xDrive35i', model_id: 1245 },
  { name: 'X5 xDrive35d', model_id: 1246 },
  { name: 'X5 xDrive40i', model_id: 1247 },
  { name: 'X5 xDrive40d', model_id: 1248 },
  { name: 'X5 xDrive45e', model_id: 1249 },
  { name: 'X5 xDrive48i', model_id: 1250 },
  { name: 'X5 xDrive50i', model_id: 1251 },
  { name: 'X5 M50i', model_id: 1252 },
  { name: 'X5 M50d', model_id: 1253 },
  { name: 'X5 M', model_id: 1254 },
  { name: 'X5 M Competition', model_id: 1255 },
  // X6
  { name: 'X6', model_id: 1260 },
  { name: 'X6 xDrive30d', model_id: 1261 },
  { name: 'X6 xDrive35i', model_id: 1262 },
  { name: 'X6 xDrive35d', model_id: 1263 },
  { name: 'X6 xDrive40i', model_id: 1264 },
  { name: 'X6 xDrive40d', model_id: 1265 },
  { name: 'X6 xDrive50i', model_id: 1266 },
  { name: 'X6 M50i', model_id: 1267 },
  { name: 'X6 M50d', model_id: 1268 },
  { name: 'X6 M', model_id: 1269 },
  { name: 'X6 M Competition', model_id: 1270 },
  // X7
  { name: 'X7', model_id: 1280 },
  { name: 'X7 xDrive30d', model_id: 1281 },
  { name: 'X7 xDrive40i', model_id: 1282 },
  { name: 'X7 xDrive40d', model_id: 1283 },
  { name: 'X7 xDrive50i', model_id: 1284 },
  { name: 'X7 M50i', model_id: 1285 },
  { name: 'X7 M50d', model_id: 1286 },
  { name: 'X7 M60i', model_id: 1287 },
  // XM
  { name: 'XM', model_id: 1290 },
  { name: 'XM Label Red', model_id: 1291 },
  // Z Series
  { name: 'Z3', model_id: 1300 },
  { name: 'Z3 1.8', model_id: 1301 },
  { name: 'Z3 1.9', model_id: 1302 },
  { name: 'Z3 2.0', model_id: 1303 },
  { name: 'Z3 2.2', model_id: 1304 },
  { name: 'Z3 2.8', model_id: 1305 },
  { name: 'Z3 3.0', model_id: 1306 },
  { name: 'Z3 M Roadster', model_id: 1307 },
  { name: 'Z3 M Coupe', model_id: 1308 },
  { name: 'Z4', model_id: 1310 },
  { name: 'Z4 sDrive20i', model_id: 1311 },
  { name: 'Z4 sDrive28i', model_id: 1312 },
  { name: 'Z4 sDrive30i', model_id: 1313 },
  { name: 'Z4 sDrive35i', model_id: 1314 },
  { name: 'Z4 sDrive35is', model_id: 1315 },
  { name: 'Z4 M40i', model_id: 1316 },
  { name: 'Z8', model_id: 1320 },
  // i Series (Electric)
  { name: 'i3', model_id: 1330 },
  { name: 'i3s', model_id: 1331 },
  { name: 'i4', model_id: 1332 },
  { name: 'i4 eDrive35', model_id: 1333 },
  { name: 'i4 eDrive40', model_id: 1334 },
  { name: 'i4 M50', model_id: 1335 },
  { name: 'i5', model_id: 1336 },
  { name: 'i5 eDrive40', model_id: 1337 },
  { name: 'i5 M60', model_id: 1338 },
  { name: 'i7', model_id: 1340 },
  { name: 'i7 xDrive60', model_id: 1341 },
  { name: 'i7 M70', model_id: 1342 },
  { name: 'i8', model_id: 1345 },
  { name: 'i8 Roadster', model_id: 1346 },
  { name: 'iX', model_id: 1350 },
  { name: 'iX xDrive40', model_id: 1351 },
  { name: 'iX xDrive50', model_id: 1352 },
  { name: 'iX M60', model_id: 1353 },
  { name: 'iX1', model_id: 1355 },
  { name: 'iX1 xDrive30', model_id: 1356 },
  { name: 'iX3', model_id: 1358 },
  // Classic / E-Series
  { name: 'E21 (3 Series)', model_id: 1400 },
  { name: 'E30 (3 Series)', model_id: 1401 },
  { name: 'E36 (3 Series)', model_id: 1402 },
  { name: 'E46 (3 Series)', model_id: 1403 },
  { name: 'E90/E91/E92/E93', model_id: 1404 },
  { name: 'F30/F31 (3 Series)', model_id: 1405 },
  { name: 'G20/G21 (3 Series)', model_id: 1406 },
  { name: 'E34 (5 Series)', model_id: 1410 },
  { name: 'E39 (5 Series)', model_id: 1411 },
  { name: 'E60/E61 (5 Series)', model_id: 1412 },
  { name: 'F10/F11 (5 Series)', model_id: 1413 },
  { name: 'G30/G31 (5 Series)', model_id: 1414 },
  { name: 'E38 (7 Series)', model_id: 1420 },
  { name: 'E65/E66 (7 Series)', model_id: 1421 },
  { name: 'F01/F02 (7 Series)', model_id: 1422 },
  { name: 'G11/G12 (7 Series)', model_id: 1423 },
  { name: 'E53 (X5)', model_id: 1430 },
  { name: 'E70 (X5)', model_id: 1431 },
  { name: 'F15 (X5)', model_id: 1432 },
  { name: 'G05 (X5)', model_id: 1433 },
  // Другие
  { name: 'Другая модель', model_id: 1999 },
];

// Все модели Hyundai
const HYUNDAI_MODELS: CarModel[] = [
  // Accent
  { name: 'Accent', model_id: 2001 },
  { name: 'Accent 1.4', model_id: 2002 },
  { name: 'Accent 1.6', model_id: 2003 },
  // Elantra
  { name: 'Elantra', model_id: 2010 },
  { name: 'Elantra 1.6', model_id: 2011 },
  { name: 'Elantra 1.8', model_id: 2012 },
  { name: 'Elantra 2.0', model_id: 2013 },
  { name: 'Elantra N', model_id: 2014 },
  { name: 'Elantra N Line', model_id: 2015 },
  { name: 'Elantra GT', model_id: 2016 },
  // Sonata
  { name: 'Sonata', model_id: 2020 },
  { name: 'Sonata 2.0', model_id: 2021 },
  { name: 'Sonata 2.4', model_id: 2022 },
  { name: 'Sonata 2.5', model_id: 2023 },
  { name: 'Sonata 2.0T', model_id: 2024 },
  { name: 'Sonata N Line', model_id: 2025 },
  { name: 'Sonata Hybrid', model_id: 2026 },
  { name: 'Sonata Plug-in Hybrid', model_id: 2027 },
  // Azera / Grandeur
  { name: 'Azera', model_id: 2030 },
  { name: 'Grandeur', model_id: 2031 },
  { name: 'Grandeur 2.4', model_id: 2032 },
  { name: 'Grandeur 3.0', model_id: 2033 },
  { name: 'Grandeur 3.3', model_id: 2034 },
  { name: 'Grandeur Hybrid', model_id: 2035 },
  // Genesis (до выделения в отдельный бренд)
  { name: 'Genesis Coupe', model_id: 2040 },
  { name: 'Genesis Coupe 2.0T', model_id: 2041 },
  { name: 'Genesis Coupe 3.8', model_id: 2042 },
  { name: 'Genesis Sedan', model_id: 2043 },
  // i10
  { name: 'i10', model_id: 2050 },
  { name: 'i10 1.0', model_id: 2051 },
  { name: 'i10 1.2', model_id: 2052 },
  { name: 'Grand i10', model_id: 2053 },
  // i20
  { name: 'i20', model_id: 2060 },
  { name: 'i20 1.2', model_id: 2061 },
  { name: 'i20 1.4', model_id: 2062 },
  { name: 'i20 N', model_id: 2063 },
  { name: 'i20 N Line', model_id: 2064 },
  { name: 'i20 Active', model_id: 2065 },
  // i30
  { name: 'i30', model_id: 2070 },
  { name: 'i30 1.4', model_id: 2071 },
  { name: 'i30 1.6', model_id: 2072 },
  { name: 'i30 2.0', model_id: 2073 },
  { name: 'i30 N', model_id: 2074 },
  { name: 'i30 N Line', model_id: 2075 },
  { name: 'i30 Fastback', model_id: 2076 },
  { name: 'i30 Fastback N', model_id: 2077 },
  { name: 'i30 Wagon', model_id: 2078 },
  // i40
  { name: 'i40', model_id: 2080 },
  { name: 'i40 1.7 CRDi', model_id: 2081 },
  { name: 'i40 2.0', model_id: 2082 },
  { name: 'i40 Wagon', model_id: 2083 },
  // Veloster
  { name: 'Veloster', model_id: 2090 },
  { name: 'Veloster 1.6', model_id: 2091 },
  { name: 'Veloster 1.6T', model_id: 2092 },
  { name: 'Veloster N', model_id: 2093 },
  { name: 'Veloster Turbo', model_id: 2094 },
  // Creta / ix25
  { name: 'Creta', model_id: 2100 },
  { name: 'Creta 1.6', model_id: 2101 },
  { name: 'Creta 2.0', model_id: 2102 },
  { name: 'ix25', model_id: 2103 },
  // Venue
  { name: 'Venue', model_id: 2110 },
  { name: 'Venue 1.0T', model_id: 2111 },
  { name: 'Venue 1.6', model_id: 2112 },
  // Kona
  { name: 'Kona', model_id: 2120 },
  { name: 'Kona 1.6', model_id: 2121 },
  { name: 'Kona 1.6T', model_id: 2122 },
  { name: 'Kona 2.0', model_id: 2123 },
  { name: 'Kona N', model_id: 2124 },
  { name: 'Kona N Line', model_id: 2125 },
  { name: 'Kona Electric', model_id: 2126 },
  { name: 'Kona Hybrid', model_id: 2127 },
  // Tucson
  { name: 'Tucson', model_id: 2130 },
  { name: 'Tucson 1.6', model_id: 2131 },
  { name: 'Tucson 1.6T', model_id: 2132 },
  { name: 'Tucson 2.0', model_id: 2133 },
  { name: 'Tucson 2.0 CRDi', model_id: 2134 },
  { name: 'Tucson 2.5', model_id: 2135 },
  { name: 'Tucson N Line', model_id: 2136 },
  { name: 'Tucson Hybrid', model_id: 2137 },
  { name: 'Tucson Plug-in Hybrid', model_id: 2138 },
  // ix35
  { name: 'ix35', model_id: 2140 },
  { name: 'ix35 1.6', model_id: 2141 },
  { name: 'ix35 2.0', model_id: 2142 },
  { name: 'ix35 2.0 CRDi', model_id: 2143 },
  // Santa Fe
  { name: 'Santa Fe', model_id: 2150 },
  { name: 'Santa Fe 2.0T', model_id: 2151 },
  { name: 'Santa Fe 2.2 CRDi', model_id: 2152 },
  { name: 'Santa Fe 2.4', model_id: 2153 },
  { name: 'Santa Fe 2.5', model_id: 2154 },
  { name: 'Santa Fe 2.7', model_id: 2155 },
  { name: 'Santa Fe 3.3', model_id: 2156 },
  { name: 'Santa Fe 3.5', model_id: 2157 },
  { name: 'Santa Fe Hybrid', model_id: 2158 },
  { name: 'Santa Fe Plug-in Hybrid', model_id: 2159 },
  { name: 'Santa Fe XL', model_id: 2160 },
  // Palisade
  { name: 'Palisade', model_id: 2170 },
  { name: 'Palisade 2.2 CRDi', model_id: 2171 },
  { name: 'Palisade 3.5', model_id: 2172 },
  { name: 'Palisade 3.8', model_id: 2173 },
  // Veracruz / ix55
  { name: 'Veracruz', model_id: 2180 },
  { name: 'ix55', model_id: 2181 },
  { name: 'ix55 3.0 CRDi', model_id: 2182 },
  { name: 'ix55 3.8', model_id: 2183 },
  // Terracan
  { name: 'Terracan', model_id: 2190 },
  { name: 'Terracan 2.5', model_id: 2191 },
  { name: 'Terracan 2.9 CRDi', model_id: 2192 },
  { name: 'Terracan 3.5', model_id: 2193 },
  // Galloper
  { name: 'Galloper', model_id: 2200 },
  { name: 'Galloper 2.5', model_id: 2201 },
  { name: 'Galloper 3.0', model_id: 2202 },
  // Starex / H-1 / Grand Starex
  { name: 'Starex', model_id: 2210 },
  { name: 'H-1', model_id: 2211 },
  { name: 'Grand Starex', model_id: 2212 },
  { name: 'H-1 2.4', model_id: 2213 },
  { name: 'H-1 2.5 CRDi', model_id: 2214 },
  // Staria
  { name: 'Staria', model_id: 2220 },
  { name: 'Staria 2.2 CRDi', model_id: 2221 },
  { name: 'Staria 3.5', model_id: 2222 },
  { name: 'Staria Premium', model_id: 2223 },
  { name: 'Staria Lounge', model_id: 2224 },
  // Porter / H100
  { name: 'Porter', model_id: 2230 },
  { name: 'Porter 2', model_id: 2231 },
  { name: 'H100', model_id: 2232 },
  // Ioniq (обычный)
  { name: 'Ioniq', model_id: 2240 },
  { name: 'Ioniq Hybrid', model_id: 2241 },
  { name: 'Ioniq Electric', model_id: 2242 },
  { name: 'Ioniq Plug-in Hybrid', model_id: 2243 },
  // Ioniq (электрический суббренд)
  { name: 'Ioniq 5', model_id: 2250 },
  { name: 'Ioniq 5 Standard Range', model_id: 2251 },
  { name: 'Ioniq 5 Long Range', model_id: 2252 },
  { name: 'Ioniq 5 N', model_id: 2253 },
  { name: 'Ioniq 6', model_id: 2254 },
  { name: 'Ioniq 6 Standard Range', model_id: 2255 },
  { name: 'Ioniq 6 Long Range', model_id: 2256 },
  // Nexo (водородный)
  { name: 'Nexo', model_id: 2260 },
  // Getz
  { name: 'Getz', model_id: 2270 },
  { name: 'Getz 1.1', model_id: 2271 },
  { name: 'Getz 1.3', model_id: 2272 },
  { name: 'Getz 1.4', model_id: 2273 },
  { name: 'Getz 1.5 CRDi', model_id: 2274 },
  { name: 'Getz 1.6', model_id: 2275 },
  // Atos / Santro
  { name: 'Atos', model_id: 2280 },
  { name: 'Atos Prime', model_id: 2281 },
  { name: 'Santro', model_id: 2282 },
  // Solaris (для СНГ)
  { name: 'Solaris', model_id: 2290 },
  { name: 'Solaris 1.4', model_id: 2291 },
  { name: 'Solaris 1.6', model_id: 2292 },
  // Matrix
  { name: 'Matrix', model_id: 2300 },
  { name: 'Matrix 1.5 CRDi', model_id: 2301 },
  { name: 'Matrix 1.6', model_id: 2302 },
  { name: 'Matrix 1.8', model_id: 2303 },
  // Trajet
  { name: 'Trajet', model_id: 2310 },
  { name: 'Trajet 2.0', model_id: 2311 },
  { name: 'Trajet 2.0 CRDi', model_id: 2312 },
  { name: 'Trajet 2.7', model_id: 2313 },
  // Coupe / Tiburon
  { name: 'Coupe', model_id: 2320 },
  { name: 'Tiburon', model_id: 2321 },
  { name: 'Tiburon 1.6', model_id: 2322 },
  { name: 'Tiburon 2.0', model_id: 2323 },
  { name: 'Tiburon 2.7', model_id: 2324 },
  // Lantra / Avante
  { name: 'Lantra', model_id: 2330 },
  { name: 'Avante', model_id: 2331 },
  { name: 'Avante XD', model_id: 2332 },
  { name: 'Avante HD', model_id: 2333 },
  { name: 'Avante MD', model_id: 2334 },
  { name: 'Avante AD', model_id: 2335 },
  { name: 'Avante CN7', model_id: 2336 },
  // Excel / Pony
  { name: 'Excel', model_id: 2340 },
  { name: 'Pony', model_id: 2341 },
  { name: 'Pony Excel', model_id: 2342 },
  // Equus / Centennial
  { name: 'Equus', model_id: 2350 },
  { name: 'Centennial', model_id: 2351 },
  { name: 'Equus 3.8', model_id: 2352 },
  { name: 'Equus 4.6', model_id: 2353 },
  { name: 'Equus 5.0', model_id: 2354 },
  // XG
  { name: 'XG', model_id: 2360 },
  { name: 'XG 25', model_id: 2361 },
  { name: 'XG 30', model_id: 2362 },
  { name: 'XG 350', model_id: 2363 },
  // Dynasty
  { name: 'Dynasty', model_id: 2370 },
  // Bayon
  { name: 'Bayon', model_id: 2380 },
  { name: 'Bayon 1.0T', model_id: 2381 },
  { name: 'Bayon 1.2', model_id: 2382 },
  // Casper
  { name: 'Casper', model_id: 2390 },
  { name: 'Casper 1.0', model_id: 2391 },
  { name: 'Casper 1.0T', model_id: 2392 },
  // Другие
  { name: 'Другая модель', model_id: 2999 },
];

// Все модели Toyota
const TOYOTA_MODELS: CarModel[] = [
  // Camry
  { name: 'Camry', model_id: 3001 },
  { name: 'Camry 2.0', model_id: 3002 },
  { name: 'Camry 2.4', model_id: 3003 },
  { name: 'Camry 2.5', model_id: 3004 },
  { name: 'Camry 3.0', model_id: 3005 },
  { name: 'Camry 3.5', model_id: 3006 },
  { name: 'Camry Hybrid', model_id: 3007 },
  // Corolla
  { name: 'Corolla', model_id: 3010 },
  { name: 'Corolla 1.3', model_id: 3011 },
  { name: 'Corolla 1.6', model_id: 3012 },
  { name: 'Corolla 1.8', model_id: 3013 },
  { name: 'Corolla 2.0', model_id: 3014 },
  { name: 'Corolla Hybrid', model_id: 3015 },
  { name: 'Corolla Cross', model_id: 3016 },
  { name: 'Corolla Cross Hybrid', model_id: 3017 },
  // Avalon
  { name: 'Avalon', model_id: 3020 },
  { name: 'Avalon 2.5', model_id: 3021 },
  { name: 'Avalon 3.5', model_id: 3022 },
  { name: 'Avalon Hybrid', model_id: 3023 },
  // Yaris
  { name: 'Yaris', model_id: 3030 },
  { name: 'Yaris 1.0', model_id: 3031 },
  { name: 'Yaris 1.3', model_id: 3032 },
  { name: 'Yaris 1.5', model_id: 3033 },
  { name: 'Yaris Hybrid', model_id: 3034 },
  { name: 'Yaris Cross', model_id: 3035 },
  { name: 'Yaris GR', model_id: 3036 },
  // Auris
  { name: 'Auris', model_id: 3040 },
  { name: 'Auris 1.4', model_id: 3041 },
  { name: 'Auris 1.6', model_id: 3042 },
  { name: 'Auris 1.8', model_id: 3043 },
  { name: 'Auris Hybrid', model_id: 3044 },
  // Avensis
  { name: 'Avensis', model_id: 3050 },
  { name: 'Avensis 1.6', model_id: 3051 },
  { name: 'Avensis 1.8', model_id: 3052 },
  { name: 'Avensis 2.0', model_id: 3053 },
  { name: 'Avensis 2.4', model_id: 3054 },
  // Prius
  { name: 'Prius', model_id: 3060 },
  { name: 'Prius 1.5', model_id: 3061 },
  { name: 'Prius 1.8', model_id: 3062 },
  { name: 'Prius 2.0', model_id: 3063 },
  { name: 'Prius Plus', model_id: 3064 },
  { name: 'Prius Prime', model_id: 3065 },
  { name: 'Prius C', model_id: 3066 },
  { name: 'Prius V', model_id: 3067 },
  // RAV4
  { name: 'RAV4', model_id: 3070 },
  { name: 'RAV4 2.0', model_id: 3071 },
  { name: 'RAV4 2.2', model_id: 3072 },
  { name: 'RAV4 2.4', model_id: 3073 },
  { name: 'RAV4 2.5', model_id: 3074 },
  { name: 'RAV4 Hybrid', model_id: 3075 },
  { name: 'RAV4 Prime', model_id: 3076 },
  // Highlander
  { name: 'Highlander', model_id: 3080 },
  { name: 'Highlander 2.7', model_id: 3081 },
  { name: 'Highlander 3.0', model_id: 3082 },
  { name: 'Highlander 3.5', model_id: 3083 },
  { name: 'Highlander Hybrid', model_id: 3084 },
  // Land Cruiser
  { name: 'Land Cruiser', model_id: 3090 },
  { name: 'Land Cruiser 100', model_id: 3091 },
  { name: 'Land Cruiser 200', model_id: 3092 },
  { name: 'Land Cruiser 300', model_id: 3093 },
  { name: 'Land Cruiser 4.0', model_id: 3094 },
  { name: 'Land Cruiser 4.5', model_id: 3095 },
  { name: 'Land Cruiser 4.6', model_id: 3096 },
  { name: 'Land Cruiser 4.7', model_id: 3097 },
  { name: 'Land Cruiser 5.7', model_id: 3098 },
  { name: 'Land Cruiser Prado', model_id: 3099 },
  { name: 'Land Cruiser Prado 2.7', model_id: 3100 },
  { name: 'Land Cruiser Prado 3.0', model_id: 3101 },
  { name: 'Land Cruiser Prado 4.0', model_id: 3102 },
  // C-HR
  { name: 'C-HR', model_id: 3110 },
  { name: 'C-HR 1.2T', model_id: 3111 },
  { name: 'C-HR 1.8 Hybrid', model_id: 3112 },
  { name: 'C-HR 2.0 Hybrid', model_id: 3113 },
  // 4Runner
  { name: '4Runner', model_id: 3120 },
  { name: '4Runner 2.7', model_id: 3121 },
  { name: '4Runner 4.0', model_id: 3122 },
  { name: '4Runner 4.7', model_id: 3123 },
  // Sequoia
  { name: 'Sequoia', model_id: 3130 },
  { name: 'Sequoia 4.7', model_id: 3131 },
  { name: 'Sequoia 5.7', model_id: 3132 },
  // Fortuner
  { name: 'Fortuner', model_id: 3140 },
  { name: 'Fortuner 2.4', model_id: 3141 },
  { name: 'Fortuner 2.7', model_id: 3142 },
  { name: 'Fortuner 2.8', model_id: 3143 },
  { name: 'Fortuner 4.0', model_id: 3144 },
  // Venza
  { name: 'Venza', model_id: 3150 },
  { name: 'Venza 2.7', model_id: 3151 },
  { name: 'Venza 3.5', model_id: 3152 },
  { name: 'Venza Hybrid', model_id: 3153 },
  // Sienna
  { name: 'Sienna', model_id: 3160 },
  { name: 'Sienna 2.7', model_id: 3161 },
  { name: 'Sienna 3.3', model_id: 3162 },
  { name: 'Sienna 3.5', model_id: 3163 },
  { name: 'Sienna Hybrid', model_id: 3164 },
  // Alphard
  { name: 'Alphard', model_id: 3170 },
  { name: 'Alphard 2.4', model_id: 3171 },
  { name: 'Alphard 2.5', model_id: 3172 },
  { name: 'Alphard 3.0', model_id: 3173 },
  { name: 'Alphard 3.5', model_id: 3174 },
  { name: 'Alphard Hybrid', model_id: 3175 },
  // Supra
  { name: 'Supra', model_id: 3180 },
  { name: 'Supra 2.0', model_id: 3181 },
  { name: 'Supra 3.0', model_id: 3182 },
  { name: 'Supra GR', model_id: 3183 },
  // 86 / GT86
  { name: '86', model_id: 3190 },
  { name: 'GT86', model_id: 3191 },
  { name: 'GR86', model_id: 3192 },
  // Celica
  { name: 'Celica', model_id: 3200 },
  { name: 'Celica 1.8', model_id: 3201 },
  { name: 'Celica 2.0', model_id: 3202 },
  // MR2
  { name: 'MR2', model_id: 3210 },
  // Tundra
  { name: 'Tundra', model_id: 3220 },
  { name: 'Tundra 4.6', model_id: 3221 },
  { name: 'Tundra 4.7', model_id: 3222 },
  { name: 'Tundra 5.7', model_id: 3223 },
  // Tacoma
  { name: 'Tacoma', model_id: 3230 },
  { name: 'Tacoma 2.7', model_id: 3231 },
  { name: 'Tacoma 3.5', model_id: 3232 },
  { name: 'Tacoma 4.0', model_id: 3233 },
  // Hilux
  { name: 'Hilux', model_id: 3240 },
  { name: 'Hilux 2.4', model_id: 3241 },
  { name: 'Hilux 2.5', model_id: 3242 },
  { name: 'Hilux 2.7', model_id: 3243 },
  { name: 'Hilux 2.8', model_id: 3244 },
  { name: 'Hilux 3.0', model_id: 3245 },
  { name: 'Hilux 4.0', model_id: 3246 },
  // Hiace
  { name: 'Hiace', model_id: 3250 },
  { name: 'Hiace 2.0', model_id: 3251 },
  { name: 'Hiace 2.5', model_id: 3252 },
  { name: 'Hiace 2.7', model_id: 3253 },
  { name: 'Hiace 3.0', model_id: 3254 },
  // Crown
  { name: 'Crown', model_id: 3260 },
  { name: 'Crown 2.0', model_id: 3261 },
  { name: 'Crown 2.5', model_id: 3262 },
  { name: 'Crown 3.0', model_id: 3263 },
  { name: 'Crown 3.5', model_id: 3264 },
  { name: 'Crown Hybrid', model_id: 3265 },
  // bZ4X
  { name: 'bZ4X', model_id: 3270 },
  // Другие
  { name: 'Другая модель', model_id: 3999 },
];

// Все модели Audi
const AUDI_MODELS: CarModel[] = [
  // A1
  { name: 'A1', model_id: 4001 },
  { name: 'A1 1.0 TFSI', model_id: 4002 },
  { name: 'A1 1.4 TFSI', model_id: 4003 },
  { name: 'A1 1.5 TFSI', model_id: 4004 },
  { name: 'A1 Sportback', model_id: 4005 },
  { name: 'S1', model_id: 4006 },
  // A3
  { name: 'A3', model_id: 4010 },
  { name: 'A3 1.4 TFSI', model_id: 4011 },
  { name: 'A3 1.5 TFSI', model_id: 4012 },
  { name: 'A3 1.8 TFSI', model_id: 4013 },
  { name: 'A3 2.0 TFSI', model_id: 4014 },
  { name: 'A3 2.0 TDI', model_id: 4015 },
  { name: 'A3 Sportback', model_id: 4016 },
  { name: 'A3 Sedan', model_id: 4017 },
  { name: 'A3 Cabriolet', model_id: 4018 },
  { name: 'A3 e-tron', model_id: 4019 },
  { name: 'S3', model_id: 4020 },
  { name: 'RS3', model_id: 4021 },
  // A4
  { name: 'A4', model_id: 4030 },
  { name: 'A4 1.8 TFSI', model_id: 4031 },
  { name: 'A4 2.0 TFSI', model_id: 4032 },
  { name: 'A4 2.0 TDI', model_id: 4033 },
  { name: 'A4 3.0 TDI', model_id: 4034 },
  { name: 'A4 3.0 TFSI', model_id: 4035 },
  { name: 'A4 Avant', model_id: 4036 },
  { name: 'A4 Allroad', model_id: 4037 },
  { name: 'S4', model_id: 4038 },
  { name: 'RS4', model_id: 4039 },
  // A5
  { name: 'A5', model_id: 4040 },
  { name: 'A5 2.0 TFSI', model_id: 4041 },
  { name: 'A5 2.0 TDI', model_id: 4042 },
  { name: 'A5 3.0 TDI', model_id: 4043 },
  { name: 'A5 Sportback', model_id: 4044 },
  { name: 'A5 Cabriolet', model_id: 4045 },
  { name: 'S5', model_id: 4046 },
  { name: 'RS5', model_id: 4047 },
  // A6
  { name: 'A6', model_id: 4050 },
  { name: 'A6 2.0 TFSI', model_id: 4051 },
  { name: 'A6 2.0 TDI', model_id: 4052 },
  { name: 'A6 2.8 FSI', model_id: 4053 },
  { name: 'A6 3.0 TDI', model_id: 4054 },
  { name: 'A6 3.0 TFSI', model_id: 4055 },
  { name: 'A6 4.0 TFSI', model_id: 4056 },
  { name: 'A6 Avant', model_id: 4057 },
  { name: 'A6 Allroad', model_id: 4058 },
  { name: 'S6', model_id: 4059 },
  { name: 'RS6', model_id: 4060 },
  { name: 'RS6 Avant', model_id: 4061 },
  // A7
  { name: 'A7', model_id: 4070 },
  { name: 'A7 2.0 TFSI', model_id: 4071 },
  { name: 'A7 3.0 TDI', model_id: 4072 },
  { name: 'A7 3.0 TFSI', model_id: 4073 },
  { name: 'A7 Sportback', model_id: 4074 },
  { name: 'S7', model_id: 4075 },
  { name: 'RS7', model_id: 4076 },
  // A8
  { name: 'A8', model_id: 4080 },
  { name: 'A8 3.0 TDI', model_id: 4081 },
  { name: 'A8 3.0 TFSI', model_id: 4082 },
  { name: 'A8 4.0 TFSI', model_id: 4083 },
  { name: 'A8 4.2 TDI', model_id: 4084 },
  { name: 'A8 4.2 FSI', model_id: 4085 },
  { name: 'A8 6.0 W12', model_id: 4086 },
  { name: 'A8 L', model_id: 4087 },
  { name: 'S8', model_id: 4088 },
  // Q2
  { name: 'Q2', model_id: 4090 },
  { name: 'Q2 1.0 TFSI', model_id: 4091 },
  { name: 'Q2 1.4 TFSI', model_id: 4092 },
  { name: 'Q2 2.0 TFSI', model_id: 4093 },
  { name: 'Q2 2.0 TDI', model_id: 4094 },
  { name: 'SQ2', model_id: 4095 },
  // Q3
  { name: 'Q3', model_id: 4100 },
  { name: 'Q3 1.4 TFSI', model_id: 4101 },
  { name: 'Q3 2.0 TFSI', model_id: 4102 },
  { name: 'Q3 2.0 TDI', model_id: 4103 },
  { name: 'Q3 Sportback', model_id: 4104 },
  { name: 'RSQ3', model_id: 4105 },
  // Q5
  { name: 'Q5', model_id: 4110 },
  { name: 'Q5 2.0 TFSI', model_id: 4111 },
  { name: 'Q5 2.0 TDI', model_id: 4112 },
  { name: 'Q5 3.0 TDI', model_id: 4113 },
  { name: 'Q5 3.0 TFSI', model_id: 4114 },
  { name: 'Q5 Sportback', model_id: 4115 },
  { name: 'Q5 e-tron', model_id: 4116 },
  { name: 'SQ5', model_id: 4117 },
  // Q7
  { name: 'Q7', model_id: 4120 },
  { name: 'Q7 2.0 TFSI', model_id: 4121 },
  { name: 'Q7 3.0 TDI', model_id: 4122 },
  { name: 'Q7 3.0 TFSI', model_id: 4123 },
  { name: 'Q7 4.0 TDI', model_id: 4124 },
  { name: 'Q7 4.2 TDI', model_id: 4125 },
  { name: 'Q7 4.2 FSI', model_id: 4126 },
  { name: 'Q7 e-tron', model_id: 4127 },
  { name: 'SQ7', model_id: 4128 },
  // Q8
  { name: 'Q8', model_id: 4130 },
  { name: 'Q8 3.0 TDI', model_id: 4131 },
  { name: 'Q8 3.0 TFSI', model_id: 4132 },
  { name: 'SQ8', model_id: 4133 },
  { name: 'RSQ8', model_id: 4134 },
  // e-tron
  { name: 'e-tron', model_id: 4140 },
  { name: 'e-tron 50', model_id: 4141 },
  { name: 'e-tron 55', model_id: 4142 },
  { name: 'e-tron S', model_id: 4143 },
  { name: 'e-tron Sportback', model_id: 4144 },
  { name: 'e-tron GT', model_id: 4145 },
  { name: 'RS e-tron GT', model_id: 4146 },
  { name: 'Q4 e-tron', model_id: 4147 },
  { name: 'Q8 e-tron', model_id: 4148 },
  // TT
  { name: 'TT', model_id: 4150 },
  { name: 'TT 1.8 TFSI', model_id: 4151 },
  { name: 'TT 2.0 TFSI', model_id: 4152 },
  { name: 'TT 2.0 TDI', model_id: 4153 },
  { name: 'TT Roadster', model_id: 4154 },
  { name: 'TTS', model_id: 4155 },
  { name: 'TT RS', model_id: 4156 },
  // R8
  { name: 'R8', model_id: 4160 },
  { name: 'R8 4.2 FSI', model_id: 4161 },
  { name: 'R8 5.2 FSI', model_id: 4162 },
  { name: 'R8 Spyder', model_id: 4163 },
  // Другие
  { name: 'Другая модель', model_id: 4999 },
];

// Все модели Volkswagen
const VW_MODELS: CarModel[] = [
  // Polo
  { name: 'Polo', model_id: 5001 },
  { name: 'Polo 1.0', model_id: 5002 },
  { name: 'Polo 1.0 TSI', model_id: 5003 },
  { name: 'Polo 1.2', model_id: 5004 },
  { name: 'Polo 1.4', model_id: 5005 },
  { name: 'Polo 1.4 TSI', model_id: 5006 },
  { name: 'Polo 1.6', model_id: 5007 },
  { name: 'Polo GTI', model_id: 5008 },
  { name: 'Polo R WRC', model_id: 5009 },
  // Golf
  { name: 'Golf', model_id: 5010 },
  { name: 'Golf 1.0 TSI', model_id: 5011 },
  { name: 'Golf 1.2 TSI', model_id: 5012 },
  { name: 'Golf 1.4 TSI', model_id: 5013 },
  { name: 'Golf 1.5 TSI', model_id: 5014 },
  { name: 'Golf 1.6', model_id: 5015 },
  { name: 'Golf 1.6 TDI', model_id: 5016 },
  { name: 'Golf 2.0 TDI', model_id: 5017 },
  { name: 'Golf 2.0 TSI', model_id: 5018 },
  { name: 'Golf Variant', model_id: 5019 },
  { name: 'Golf Plus', model_id: 5020 },
  { name: 'Golf GTI', model_id: 5021 },
  { name: 'Golf GTD', model_id: 5022 },
  { name: 'Golf GTE', model_id: 5023 },
  { name: 'Golf R', model_id: 5024 },
  { name: 'e-Golf', model_id: 5025 },
  // Jetta
  { name: 'Jetta', model_id: 5030 },
  { name: 'Jetta 1.4 TSI', model_id: 5031 },
  { name: 'Jetta 1.6', model_id: 5032 },
  { name: 'Jetta 1.8 TSI', model_id: 5033 },
  { name: 'Jetta 2.0', model_id: 5034 },
  { name: 'Jetta 2.0 TDI', model_id: 5035 },
  { name: 'Jetta GLI', model_id: 5036 },
  // Passat
  { name: 'Passat', model_id: 5040 },
  { name: 'Passat 1.4 TSI', model_id: 5041 },
  { name: 'Passat 1.8 TSI', model_id: 5042 },
  { name: 'Passat 2.0 TDI', model_id: 5043 },
  { name: 'Passat 2.0 TSI', model_id: 5044 },
  { name: 'Passat 3.6 FSI', model_id: 5045 },
  { name: 'Passat Variant', model_id: 5046 },
  { name: 'Passat Alltrack', model_id: 5047 },
  { name: 'Passat CC', model_id: 5048 },
  { name: 'Passat GTE', model_id: 5049 },
  // Arteon
  { name: 'Arteon', model_id: 5050 },
  { name: 'Arteon 2.0 TDI', model_id: 5051 },
  { name: 'Arteon 2.0 TSI', model_id: 5052 },
  { name: 'Arteon Shooting Brake', model_id: 5053 },
  { name: 'Arteon R', model_id: 5054 },
  // Tiguan
  { name: 'Tiguan', model_id: 5060 },
  { name: 'Tiguan 1.4 TSI', model_id: 5061 },
  { name: 'Tiguan 2.0 TDI', model_id: 5062 },
  { name: 'Tiguan 2.0 TSI', model_id: 5063 },
  { name: 'Tiguan Allspace', model_id: 5064 },
  { name: 'Tiguan R', model_id: 5065 },
  { name: 'Tiguan eHybrid', model_id: 5066 },
  // T-Roc
  { name: 'T-Roc', model_id: 5070 },
  { name: 'T-Roc 1.0 TSI', model_id: 5071 },
  { name: 'T-Roc 1.5 TSI', model_id: 5072 },
  { name: 'T-Roc 2.0 TDI', model_id: 5073 },
  { name: 'T-Roc 2.0 TSI', model_id: 5074 },
  { name: 'T-Roc Cabriolet', model_id: 5075 },
  { name: 'T-Roc R', model_id: 5076 },
  // T-Cross
  { name: 'T-Cross', model_id: 5080 },
  { name: 'T-Cross 1.0 TSI', model_id: 5081 },
  { name: 'T-Cross 1.5 TSI', model_id: 5082 },
  // Taos
  { name: 'Taos', model_id: 5085 },
  // Touareg
  { name: 'Touareg', model_id: 5090 },
  { name: 'Touareg 2.5 TDI', model_id: 5091 },
  { name: 'Touareg 3.0 TDI', model_id: 5092 },
  { name: 'Touareg 3.0 TSI', model_id: 5093 },
  { name: 'Touareg 3.6 FSI', model_id: 5094 },
  { name: 'Touareg 4.0 TDI', model_id: 5095 },
  { name: 'Touareg 4.2 TDI', model_id: 5096 },
  { name: 'Touareg R', model_id: 5097 },
  { name: 'Touareg eHybrid', model_id: 5098 },
  // Atlas
  { name: 'Atlas', model_id: 5100 },
  { name: 'Atlas 2.0 TSI', model_id: 5101 },
  { name: 'Atlas 3.6 FSI', model_id: 5102 },
  { name: 'Atlas Cross Sport', model_id: 5103 },
  // Touran
  { name: 'Touran', model_id: 5110 },
  { name: 'Touran 1.2 TSI', model_id: 5111 },
  { name: 'Touran 1.4 TSI', model_id: 5112 },
  { name: 'Touran 1.6 TDI', model_id: 5113 },
  { name: 'Touran 2.0 TDI', model_id: 5114 },
  // Sharan
  { name: 'Sharan', model_id: 5120 },
  { name: 'Sharan 1.4 TSI', model_id: 5121 },
  { name: 'Sharan 2.0 TDI', model_id: 5122 },
  // Multivan / Transporter
  { name: 'Multivan', model_id: 5130 },
  { name: 'Multivan T5', model_id: 5131 },
  { name: 'Multivan T6', model_id: 5132 },
  { name: 'Multivan T6.1', model_id: 5133 },
  { name: 'Multivan T7', model_id: 5134 },
  { name: 'Transporter', model_id: 5135 },
  { name: 'Caravelle', model_id: 5136 },
  { name: 'California', model_id: 5137 },
  // ID (Electric)
  { name: 'ID.3', model_id: 5140 },
  { name: 'ID.3 Pro', model_id: 5141 },
  { name: 'ID.3 Pro S', model_id: 5142 },
  { name: 'ID.4', model_id: 5143 },
  { name: 'ID.4 Pro', model_id: 5144 },
  { name: 'ID.4 GTX', model_id: 5145 },
  { name: 'ID.5', model_id: 5146 },
  { name: 'ID.5 GTX', model_id: 5147 },
  { name: 'ID.6', model_id: 5148 },
  { name: 'ID.7', model_id: 5149 },
  { name: 'ID. Buzz', model_id: 5150 },
  // Up!
  { name: 'Up!', model_id: 5160 },
  { name: 'e-Up!', model_id: 5161 },
  { name: 'Up! GTI', model_id: 5162 },
  // Beetle
  { name: 'Beetle', model_id: 5170 },
  { name: 'New Beetle', model_id: 5171 },
  { name: 'Beetle 1.2 TSI', model_id: 5172 },
  { name: 'Beetle 1.4 TSI', model_id: 5173 },
  { name: 'Beetle 2.0 TDI', model_id: 5174 },
  { name: 'Beetle 2.0 TSI', model_id: 5175 },
  { name: 'Beetle Cabriolet', model_id: 5176 },
  // Scirocco
  { name: 'Scirocco', model_id: 5180 },
  { name: 'Scirocco 1.4 TSI', model_id: 5181 },
  { name: 'Scirocco 2.0 TDI', model_id: 5182 },
  { name: 'Scirocco 2.0 TSI', model_id: 5183 },
  { name: 'Scirocco R', model_id: 5184 },
  // Amarok
  { name: 'Amarok', model_id: 5190 },
  { name: 'Amarok 2.0 TDI', model_id: 5191 },
  { name: 'Amarok 3.0 TDI', model_id: 5192 },
  // Phaeton
  { name: 'Phaeton', model_id: 5200 },
  { name: 'Phaeton 3.0 TDI', model_id: 5201 },
  { name: 'Phaeton 4.2 FSI', model_id: 5202 },
  { name: 'Phaeton 6.0 W12', model_id: 5203 },
  // Caddy
  { name: 'Caddy', model_id: 5210 },
  { name: 'Caddy 1.4', model_id: 5211 },
  { name: 'Caddy 1.6 TDI', model_id: 5212 },
  { name: 'Caddy 2.0 TDI', model_id: 5213 },
  { name: 'Caddy Maxi', model_id: 5214 },
  // Crafter
  { name: 'Crafter', model_id: 5220 },
  { name: 'Crafter 2.0 TDI', model_id: 5221 },
  // Другие
  { name: 'Другая модель', model_id: 5999 },
];

// Все модели Kia
const KIA_MODELS: CarModel[] = [
  // Rio
  { name: 'Rio', model_id: 6001 },
  { name: 'Rio 1.2', model_id: 6002 },
  { name: 'Rio 1.4', model_id: 6003 },
  { name: 'Rio 1.6', model_id: 6004 },
  { name: 'Rio X-Line', model_id: 6005 },
  // Ceed
  { name: 'Ceed', model_id: 6010 },
  { name: 'Ceed 1.0 T-GDI', model_id: 6011 },
  { name: 'Ceed 1.4', model_id: 6012 },
  { name: 'Ceed 1.5 T-GDI', model_id: 6013 },
  { name: 'Ceed 1.6', model_id: 6014 },
  { name: 'Ceed 1.6 CRDi', model_id: 6015 },
  { name: 'Ceed 2.0', model_id: 6016 },
  { name: 'Ceed SW', model_id: 6017 },
  { name: 'Ceed GT', model_id: 6018 },
  { name: 'Ceed GT Line', model_id: 6019 },
  { name: 'ProCeed', model_id: 6020 },
  { name: 'ProCeed GT', model_id: 6021 },
  { name: 'XCeed', model_id: 6022 },
  // Cerato / Forte
  { name: 'Cerato', model_id: 6030 },
  { name: 'Cerato 1.6', model_id: 6031 },
  { name: 'Cerato 2.0', model_id: 6032 },
  { name: 'Cerato Koup', model_id: 6033 },
  { name: 'Forte', model_id: 6034 },
  { name: 'Forte GT', model_id: 6035 },
  // K5 / Optima
  { name: 'K5', model_id: 6040 },
  { name: 'K5 2.0', model_id: 6041 },
  { name: 'K5 2.5', model_id: 6042 },
  { name: 'K5 GT', model_id: 6043 },
  { name: 'K5 Hybrid', model_id: 6044 },
  { name: 'Optima', model_id: 6045 },
  { name: 'Optima 2.0', model_id: 6046 },
  { name: 'Optima 2.4', model_id: 6047 },
  { name: 'Optima Hybrid', model_id: 6048 },
  // K8 / Cadenza
  { name: 'K8', model_id: 6050 },
  { name: 'K8 2.5', model_id: 6051 },
  { name: 'K8 3.5', model_id: 6052 },
  { name: 'K8 Hybrid', model_id: 6053 },
  { name: 'Cadenza', model_id: 6054 },
  // K9 / Quoris
  { name: 'K9', model_id: 6060 },
  { name: 'K9 3.3', model_id: 6061 },
  { name: 'K9 3.8', model_id: 6062 },
  { name: 'K9 5.0', model_id: 6063 },
  { name: 'Quoris', model_id: 6064 },
  // Stinger
  { name: 'Stinger', model_id: 6070 },
  { name: 'Stinger 2.0 T-GDI', model_id: 6071 },
  { name: 'Stinger 2.2 CRDi', model_id: 6072 },
  { name: 'Stinger 3.3 T-GDI', model_id: 6073 },
  { name: 'Stinger GT', model_id: 6074 },
  // Picanto / Morning
  { name: 'Picanto', model_id: 6080 },
  { name: 'Picanto 1.0', model_id: 6081 },
  { name: 'Picanto 1.2', model_id: 6082 },
  { name: 'Picanto GT-Line', model_id: 6083 },
  { name: 'Morning', model_id: 6084 },
  // Soul
  { name: 'Soul', model_id: 6090 },
  { name: 'Soul 1.6', model_id: 6091 },
  { name: 'Soul 2.0', model_id: 6092 },
  { name: 'Soul EV', model_id: 6093 },
  // Seltos
  { name: 'Seltos', model_id: 6100 },
  { name: 'Seltos 1.6', model_id: 6101 },
  { name: 'Seltos 1.6 T-GDI', model_id: 6102 },
  { name: 'Seltos 2.0', model_id: 6103 },
  // Sportage
  { name: 'Sportage', model_id: 6110 },
  { name: 'Sportage 1.6', model_id: 6111 },
  { name: 'Sportage 1.6 T-GDI', model_id: 6112 },
  { name: 'Sportage 2.0', model_id: 6113 },
  { name: 'Sportage 2.0 CRDi', model_id: 6114 },
  { name: 'Sportage 2.4', model_id: 6115 },
  { name: 'Sportage Hybrid', model_id: 6116 },
  { name: 'Sportage PHEV', model_id: 6117 },
  { name: 'Sportage GT-Line', model_id: 6118 },
  // Sorento
  { name: 'Sorento', model_id: 6120 },
  { name: 'Sorento 2.2 CRDi', model_id: 6121 },
  { name: 'Sorento 2.4', model_id: 6122 },
  { name: 'Sorento 2.5', model_id: 6123 },
  { name: 'Sorento 3.3', model_id: 6124 },
  { name: 'Sorento 3.5', model_id: 6125 },
  { name: 'Sorento Hybrid', model_id: 6126 },
  { name: 'Sorento PHEV', model_id: 6127 },
  // Mohave / Borrego
  { name: 'Mohave', model_id: 6130 },
  { name: 'Mohave 3.0 CRDi', model_id: 6131 },
  { name: 'Mohave 3.8', model_id: 6132 },
  { name: 'Borrego', model_id: 6133 },
  // Telluride
  { name: 'Telluride', model_id: 6140 },
  { name: 'Telluride 3.8', model_id: 6141 },
  // Carnival / Sedona
  { name: 'Carnival', model_id: 6150 },
  { name: 'Carnival 2.2 CRDi', model_id: 6151 },
  { name: 'Carnival 2.9 CRDi', model_id: 6152 },
  { name: 'Carnival 3.3', model_id: 6153 },
  { name: 'Carnival 3.5', model_id: 6154 },
  { name: 'Sedona', model_id: 6155 },
  // Niro
  { name: 'Niro', model_id: 6160 },
  { name: 'Niro Hybrid', model_id: 6161 },
  { name: 'Niro PHEV', model_id: 6162 },
  { name: 'Niro EV', model_id: 6163 },
  // EV6
  { name: 'EV6', model_id: 6170 },
  { name: 'EV6 Standard', model_id: 6171 },
  { name: 'EV6 Long Range', model_id: 6172 },
  { name: 'EV6 GT', model_id: 6173 },
  { name: 'EV6 GT-Line', model_id: 6174 },
  // EV9
  { name: 'EV9', model_id: 6180 },
  { name: 'EV9 Standard', model_id: 6181 },
  { name: 'EV9 Long Range', model_id: 6182 },
  { name: 'EV9 GT-Line', model_id: 6183 },
  // Bongo
  { name: 'Bongo', model_id: 6190 },
  { name: 'Bongo 2.5', model_id: 6191 },
  { name: 'Bongo 2.7', model_id: 6192 },
  // Spectra
  { name: 'Spectra', model_id: 6200 },
  // Magentis
  { name: 'Magentis', model_id: 6210 },
  { name: 'Magentis 2.0', model_id: 6211 },
  { name: 'Magentis 2.4', model_id: 6212 },
  { name: 'Magentis 2.7', model_id: 6213 },
  // Opirus / Amanti
  { name: 'Opirus', model_id: 6220 },
  { name: 'Amanti', model_id: 6221 },
  // Carens / Rondo
  { name: 'Carens', model_id: 6230 },
  { name: 'Carens 1.6', model_id: 6231 },
  { name: 'Carens 2.0', model_id: 6232 },
  { name: 'Rondo', model_id: 6233 },
  // Venga
  { name: 'Venga', model_id: 6240 },
  { name: 'Venga 1.4', model_id: 6241 },
  { name: 'Venga 1.6', model_id: 6242 },
  // Другие
  { name: 'Другая модель', model_id: 6999 },
];

// Все модели Nissan
const NISSAN_MODELS: CarModel[] = [
  // Almera / Sunny
  { name: 'Almera', model_id: 7001 },
  { name: 'Almera 1.5', model_id: 7002 },
  { name: 'Almera 1.6', model_id: 7003 },
  { name: 'Almera 1.8', model_id: 7004 },
  { name: 'Almera Classic', model_id: 7005 },
  { name: 'Sunny', model_id: 7006 },
  // Sentra
  { name: 'Sentra', model_id: 7010 },
  { name: 'Sentra 1.6', model_id: 7011 },
  { name: 'Sentra 1.8', model_id: 7012 },
  { name: 'Sentra 2.0', model_id: 7013 },
  // Altima
  { name: 'Altima', model_id: 7020 },
  { name: 'Altima 2.0', model_id: 7021 },
  { name: 'Altima 2.5', model_id: 7022 },
  { name: 'Altima 3.5', model_id: 7023 },
  // Maxima
  { name: 'Maxima', model_id: 7030 },
  { name: 'Maxima 2.0', model_id: 7031 },
  { name: 'Maxima 3.0', model_id: 7032 },
  { name: 'Maxima 3.5', model_id: 7033 },
  // Teana
  { name: 'Teana', model_id: 7040 },
  { name: 'Teana 2.0', model_id: 7041 },
  { name: 'Teana 2.3', model_id: 7042 },
  { name: 'Teana 2.5', model_id: 7043 },
  { name: 'Teana 3.5', model_id: 7044 },
  // Note
  { name: 'Note', model_id: 7050 },
  { name: 'Note 1.2', model_id: 7051 },
  { name: 'Note 1.4', model_id: 7052 },
  { name: 'Note 1.5 dCi', model_id: 7053 },
  { name: 'Note 1.6', model_id: 7054 },
  { name: 'Note e-Power', model_id: 7055 },
  // Micra / March
  { name: 'Micra', model_id: 7060 },
  { name: 'Micra 1.0', model_id: 7061 },
  { name: 'Micra 1.2', model_id: 7062 },
  { name: 'Micra 1.4', model_id: 7063 },
  { name: 'March', model_id: 7064 },
  // Tiida
  { name: 'Tiida', model_id: 7070 },
  { name: 'Tiida 1.6', model_id: 7071 },
  { name: 'Tiida 1.8', model_id: 7072 },
  // Versa
  { name: 'Versa', model_id: 7075 },
  // Juke
  { name: 'Juke', model_id: 7080 },
  { name: 'Juke 1.0', model_id: 7081 },
  { name: 'Juke 1.2', model_id: 7082 },
  { name: 'Juke 1.5 dCi', model_id: 7083 },
  { name: 'Juke 1.6', model_id: 7084 },
  { name: 'Juke Nismo', model_id: 7085 },
  // Kicks
  { name: 'Kicks', model_id: 7090 },
  { name: 'Kicks 1.6', model_id: 7091 },
  { name: 'Kicks e-Power', model_id: 7092 },
  // Qashqai
  { name: 'Qashqai', model_id: 7100 },
  { name: 'Qashqai 1.2', model_id: 7101 },
  { name: 'Qashqai 1.3', model_id: 7102 },
  { name: 'Qashqai 1.5 dCi', model_id: 7103 },
  { name: 'Qashqai 1.6', model_id: 7104 },
  { name: 'Qashqai 2.0', model_id: 7105 },
  { name: 'Qashqai e-Power', model_id: 7106 },
  // X-Trail / Rogue
  { name: 'X-Trail', model_id: 7110 },
  { name: 'X-Trail 1.6 dCi', model_id: 7111 },
  { name: 'X-Trail 2.0', model_id: 7112 },
  { name: 'X-Trail 2.5', model_id: 7113 },
  { name: 'X-Trail e-Power', model_id: 7114 },
  { name: 'Rogue', model_id: 7115 },
  // Murano
  { name: 'Murano', model_id: 7120 },
  { name: 'Murano 2.5', model_id: 7121 },
  { name: 'Murano 3.5', model_id: 7122 },
  // Pathfinder
  { name: 'Pathfinder', model_id: 7130 },
  { name: 'Pathfinder 2.5 dCi', model_id: 7131 },
  { name: 'Pathfinder 3.0 dCi', model_id: 7132 },
  { name: 'Pathfinder 3.5', model_id: 7133 },
  { name: 'Pathfinder 4.0', model_id: 7134 },
  // Patrol
  { name: 'Patrol', model_id: 7140 },
  { name: 'Patrol 3.0', model_id: 7141 },
  { name: 'Patrol 4.0', model_id: 7142 },
  { name: 'Patrol 4.8', model_id: 7143 },
  { name: 'Patrol 5.6', model_id: 7144 },
  // Armada
  { name: 'Armada', model_id: 7150 },
  { name: 'Armada 5.6', model_id: 7151 },
  // Terra
  { name: 'Terra', model_id: 7155 },
  // Navara / Frontier
  { name: 'Navara', model_id: 7160 },
  { name: 'Navara 2.3 dCi', model_id: 7161 },
  { name: 'Navara 2.5', model_id: 7162 },
  { name: 'Navara 3.0', model_id: 7163 },
  { name: 'Frontier', model_id: 7164 },
  // Titan
  { name: 'Titan', model_id: 7170 },
  { name: 'Titan 5.0', model_id: 7171 },
  { name: 'Titan 5.6', model_id: 7172 },
  // GT-R
  { name: 'GT-R', model_id: 7180 },
  { name: 'GT-R Nismo', model_id: 7181 },
  // 370Z / 350Z
  { name: '370Z', model_id: 7190 },
  { name: '370Z Nismo', model_id: 7191 },
  { name: '350Z', model_id: 7192 },
  { name: 'Z', model_id: 7193 },
  // Leaf
  { name: 'Leaf', model_id: 7200 },
  { name: 'Leaf 40 kWh', model_id: 7201 },
  { name: 'Leaf 62 kWh', model_id: 7202 },
  // Ariya
  { name: 'Ariya', model_id: 7210 },
  // Serena
  { name: 'Serena', model_id: 7220 },
  { name: 'Serena 2.0', model_id: 7221 },
  { name: 'Serena e-Power', model_id: 7222 },
  // Elgrand
  { name: 'Elgrand', model_id: 7230 },
  { name: 'Elgrand 2.5', model_id: 7231 },
  { name: 'Elgrand 3.5', model_id: 7232 },
  // Primera
  { name: 'Primera', model_id: 7240 },
  { name: 'Primera 1.6', model_id: 7241 },
  { name: 'Primera 1.8', model_id: 7242 },
  { name: 'Primera 2.0', model_id: 7243 },
  // Другие
  { name: 'Другая модель', model_id: 7999 },
];

// Все модели Honda
const HONDA_MODELS: CarModel[] = [
  // Civic
  { name: 'Civic', model_id: 8001 },
  { name: 'Civic 1.4', model_id: 8002 },
  { name: 'Civic 1.5', model_id: 8003 },
  { name: 'Civic 1.5T', model_id: 8004 },
  { name: 'Civic 1.6', model_id: 8005 },
  { name: 'Civic 1.8', model_id: 8006 },
  { name: 'Civic 2.0', model_id: 8007 },
  { name: 'Civic Type R', model_id: 8008 },
  { name: 'Civic Si', model_id: 8009 },
  { name: 'Civic Hybrid', model_id: 8010 },
  { name: 'Civic Hatchback', model_id: 8011 },
  // Accord
  { name: 'Accord', model_id: 8020 },
  { name: 'Accord 1.5T', model_id: 8021 },
  { name: 'Accord 2.0', model_id: 8022 },
  { name: 'Accord 2.0T', model_id: 8023 },
  { name: 'Accord 2.4', model_id: 8024 },
  { name: 'Accord 3.0', model_id: 8025 },
  { name: 'Accord 3.5', model_id: 8026 },
  { name: 'Accord Hybrid', model_id: 8027 },
  // City
  { name: 'City', model_id: 8030 },
  { name: 'City 1.5', model_id: 8031 },
  { name: 'City Hybrid', model_id: 8032 },
  // Fit / Jazz
  { name: 'Fit', model_id: 8040 },
  { name: 'Jazz', model_id: 8041 },
  { name: 'Jazz 1.2', model_id: 8042 },
  { name: 'Jazz 1.3', model_id: 8043 },
  { name: 'Jazz 1.4', model_id: 8044 },
  { name: 'Jazz 1.5', model_id: 8045 },
  { name: 'Jazz e:HEV', model_id: 8046 },
  // Insight
  { name: 'Insight', model_id: 8050 },
  { name: 'Insight Hybrid', model_id: 8051 },
  // HR-V
  { name: 'HR-V', model_id: 8060 },
  { name: 'HR-V 1.5', model_id: 8061 },
  { name: 'HR-V 1.8', model_id: 8062 },
  { name: 'HR-V e:HEV', model_id: 8063 },
  // Vezel
  { name: 'Vezel', model_id: 8065 },
  // CR-V
  { name: 'CR-V', model_id: 8070 },
  { name: 'CR-V 1.5T', model_id: 8071 },
  { name: 'CR-V 2.0', model_id: 8072 },
  { name: 'CR-V 2.4', model_id: 8073 },
  { name: 'CR-V Hybrid', model_id: 8074 },
  { name: 'CR-V e:HEV', model_id: 8075 },
  // Passport
  { name: 'Passport', model_id: 8080 },
  { name: 'Passport 3.5', model_id: 8081 },
  // Pilot
  { name: 'Pilot', model_id: 8090 },
  { name: 'Pilot 3.0', model_id: 8091 },
  { name: 'Pilot 3.5', model_id: 8092 },
  // ZR-V
  { name: 'ZR-V', model_id: 8095 },
  // Odyssey
  { name: 'Odyssey', model_id: 8100 },
  { name: 'Odyssey 2.4', model_id: 8101 },
  { name: 'Odyssey 3.5', model_id: 8102 },
  // Stepwgn
  { name: 'Stepwgn', model_id: 8110 },
  { name: 'Stepwgn 1.5T', model_id: 8111 },
  { name: 'Stepwgn 2.0', model_id: 8112 },
  { name: 'Stepwgn e:HEV', model_id: 8113 },
  // Freed
  { name: 'Freed', model_id: 8120 },
  { name: 'Freed 1.5', model_id: 8121 },
  { name: 'Freed e:HEV', model_id: 8122 },
  // Stream
  { name: 'Stream', model_id: 8130 },
  { name: 'Stream 1.8', model_id: 8131 },
  { name: 'Stream 2.0', model_id: 8132 },
  // Legend
  { name: 'Legend', model_id: 8140 },
  { name: 'Legend 3.5', model_id: 8141 },
  // Ridgeline
  { name: 'Ridgeline', model_id: 8150 },
  { name: 'Ridgeline 3.5', model_id: 8151 },
  // NSX
  { name: 'NSX', model_id: 8160 },
  { name: 'NSX Type S', model_id: 8161 },
  // S2000
  { name: 'S2000', model_id: 8170 },
  // Prelude
  { name: 'Prelude', model_id: 8180 },
  // Element
  { name: 'Element', model_id: 8190 },
  // e
  { name: 'Honda e', model_id: 8200 },
  // Prologue
  { name: 'Prologue', model_id: 8210 },
  // Другие
  { name: 'Другая модель', model_id: 8999 },
];

// Все модели Lexus
const LEXUS_MODELS: CarModel[] = [
  // IS
  { name: 'IS', model_id: 9001 },
  { name: 'IS 200', model_id: 9002 },
  { name: 'IS 200t', model_id: 9003 },
  { name: 'IS 250', model_id: 9004 },
  { name: 'IS 300', model_id: 9005 },
  { name: 'IS 300h', model_id: 9006 },
  { name: 'IS 350', model_id: 9007 },
  { name: 'IS 500', model_id: 9008 },
  { name: 'IS F', model_id: 9009 },
  // ES
  { name: 'ES', model_id: 9010 },
  { name: 'ES 250', model_id: 9011 },
  { name: 'ES 300', model_id: 9012 },
  { name: 'ES 300h', model_id: 9013 },
  { name: 'ES 330', model_id: 9014 },
  { name: 'ES 350', model_id: 9015 },
  // GS
  { name: 'GS', model_id: 9020 },
  { name: 'GS 200t', model_id: 9021 },
  { name: 'GS 250', model_id: 9022 },
  { name: 'GS 300', model_id: 9023 },
  { name: 'GS 300h', model_id: 9024 },
  { name: 'GS 350', model_id: 9025 },
  { name: 'GS 430', model_id: 9026 },
  { name: 'GS 450h', model_id: 9027 },
  { name: 'GS 460', model_id: 9028 },
  { name: 'GS F', model_id: 9029 },
  // LS
  { name: 'LS', model_id: 9030 },
  { name: 'LS 400', model_id: 9031 },
  { name: 'LS 430', model_id: 9032 },
  { name: 'LS 460', model_id: 9033 },
  { name: 'LS 500', model_id: 9034 },
  { name: 'LS 500h', model_id: 9035 },
  { name: 'LS 600h', model_id: 9036 },
  // UX
  { name: 'UX', model_id: 9040 },
  { name: 'UX 200', model_id: 9041 },
  { name: 'UX 250h', model_id: 9042 },
  { name: 'UX 300e', model_id: 9043 },
  // NX
  { name: 'NX', model_id: 9050 },
  { name: 'NX 200', model_id: 9051 },
  { name: 'NX 200t', model_id: 9052 },
  { name: 'NX 250', model_id: 9053 },
  { name: 'NX 300', model_id: 9054 },
  { name: 'NX 300h', model_id: 9055 },
  { name: 'NX 350', model_id: 9056 },
  { name: 'NX 350h', model_id: 9057 },
  { name: 'NX 450h+', model_id: 9058 },
  // RX
  { name: 'RX', model_id: 9060 },
  { name: 'RX 270', model_id: 9061 },
  { name: 'RX 300', model_id: 9062 },
  { name: 'RX 330', model_id: 9063 },
  { name: 'RX 350', model_id: 9064 },
  { name: 'RX 350h', model_id: 9065 },
  { name: 'RX 400h', model_id: 9066 },
  { name: 'RX 450h', model_id: 9067 },
  { name: 'RX 450h+', model_id: 9068 },
  { name: 'RX 500h', model_id: 9069 },
  // GX
  { name: 'GX', model_id: 9070 },
  { name: 'GX 460', model_id: 9071 },
  { name: 'GX 470', model_id: 9072 },
  { name: 'GX 550', model_id: 9073 },
  // LX
  { name: 'LX', model_id: 9080 },
  { name: 'LX 450', model_id: 9081 },
  { name: 'LX 470', model_id: 9082 },
  { name: 'LX 570', model_id: 9083 },
  { name: 'LX 600', model_id: 9084 },
  // RC
  { name: 'RC', model_id: 9090 },
  { name: 'RC 200t', model_id: 9091 },
  { name: 'RC 300', model_id: 9092 },
  { name: 'RC 300h', model_id: 9093 },
  { name: 'RC 350', model_id: 9094 },
  { name: 'RC F', model_id: 9095 },
  // LC
  { name: 'LC', model_id: 9100 },
  { name: 'LC 500', model_id: 9101 },
  { name: 'LC 500h', model_id: 9102 },
  // LFA
  { name: 'LFA', model_id: 9110 },
  // CT
  { name: 'CT', model_id: 9120 },
  { name: 'CT 200h', model_id: 9121 },
  // HS
  { name: 'HS', model_id: 9130 },
  { name: 'HS 250h', model_id: 9131 },
  // RZ
  { name: 'RZ', model_id: 9140 },
  { name: 'RZ 450e', model_id: 9141 },
  // Другие
  { name: 'Другая модель', model_id: 9999 },
];

// Все модели Ford
const FORD_MODELS: CarModel[] = [
  // Fiesta
  { name: 'Fiesta', model_id: 10001 },
  { name: 'Fiesta 1.0', model_id: 10002 },
  { name: 'Fiesta 1.0 EcoBoost', model_id: 10003 },
  { name: 'Fiesta 1.25', model_id: 10004 },
  { name: 'Fiesta 1.4', model_id: 10005 },
  { name: 'Fiesta 1.5 TDCi', model_id: 10006 },
  { name: 'Fiesta 1.6', model_id: 10007 },
  { name: 'Fiesta ST', model_id: 10008 },
  // Focus
  { name: 'Focus', model_id: 10010 },
  { name: 'Focus 1.0 EcoBoost', model_id: 10011 },
  { name: 'Focus 1.5', model_id: 10012 },
  { name: 'Focus 1.5 TDCi', model_id: 10013 },
  { name: 'Focus 1.6', model_id: 10014 },
  { name: 'Focus 1.6 TDCi', model_id: 10015 },
  { name: 'Focus 2.0', model_id: 10016 },
  { name: 'Focus 2.0 TDCi', model_id: 10017 },
  { name: 'Focus ST', model_id: 10018 },
  { name: 'Focus RS', model_id: 10019 },
  // Mondeo / Fusion
  { name: 'Mondeo', model_id: 10020 },
  { name: 'Mondeo 1.5 EcoBoost', model_id: 10021 },
  { name: 'Mondeo 2.0', model_id: 10022 },
  { name: 'Mondeo 2.0 TDCi', model_id: 10023 },
  { name: 'Mondeo 2.5', model_id: 10024 },
  { name: 'Mondeo Hybrid', model_id: 10025 },
  { name: 'Fusion', model_id: 10026 },
  { name: 'Fusion 1.5 EcoBoost', model_id: 10027 },
  { name: 'Fusion 2.0 EcoBoost', model_id: 10028 },
  { name: 'Fusion 2.5', model_id: 10029 },
  { name: 'Fusion Hybrid', model_id: 10030 },
  // Taurus
  { name: 'Taurus', model_id: 10035 },
  { name: 'Taurus 2.0 EcoBoost', model_id: 10036 },
  { name: 'Taurus 3.5', model_id: 10037 },
  { name: 'Taurus SHO', model_id: 10038 },
  // Mustang
  { name: 'Mustang', model_id: 10040 },
  { name: 'Mustang 2.3 EcoBoost', model_id: 10041 },
  { name: 'Mustang 3.7', model_id: 10042 },
  { name: 'Mustang 5.0 GT', model_id: 10043 },
  { name: 'Mustang Shelby GT350', model_id: 10044 },
  { name: 'Mustang Shelby GT500', model_id: 10045 },
  { name: 'Mustang Mach-E', model_id: 10046 },
  { name: 'Mustang Mach 1', model_id: 10047 },
  { name: 'Mustang Dark Horse', model_id: 10048 },
  // EcoSport
  { name: 'EcoSport', model_id: 10050 },
  { name: 'EcoSport 1.0 EcoBoost', model_id: 10051 },
  { name: 'EcoSport 1.5', model_id: 10052 },
  { name: 'EcoSport 2.0', model_id: 10053 },
  // Puma
  { name: 'Puma', model_id: 10055 },
  { name: 'Puma 1.0 EcoBoost', model_id: 10056 },
  { name: 'Puma ST', model_id: 10057 },
  // Kuga / Escape
  { name: 'Kuga', model_id: 10060 },
  { name: 'Kuga 1.5 EcoBoost', model_id: 10061 },
  { name: 'Kuga 1.5 TDCi', model_id: 10062 },
  { name: 'Kuga 2.0 TDCi', model_id: 10063 },
  { name: 'Kuga 2.5 Hybrid', model_id: 10064 },
  { name: 'Kuga PHEV', model_id: 10065 },
  { name: 'Escape', model_id: 10066 },
  { name: 'Escape 1.5 EcoBoost', model_id: 10067 },
  { name: 'Escape 2.0 EcoBoost', model_id: 10068 },
  { name: 'Escape Hybrid', model_id: 10069 },
  // Edge
  { name: 'Edge', model_id: 10070 },
  { name: 'Edge 2.0 EcoBoost', model_id: 10071 },
  { name: 'Edge 2.7 EcoBoost', model_id: 10072 },
  { name: 'Edge 3.5', model_id: 10073 },
  { name: 'Edge ST', model_id: 10074 },
  // Explorer
  { name: 'Explorer', model_id: 10080 },
  { name: 'Explorer 2.3 EcoBoost', model_id: 10081 },
  { name: 'Explorer 3.0 EcoBoost', model_id: 10082 },
  { name: 'Explorer 3.3 Hybrid', model_id: 10083 },
  { name: 'Explorer 3.5', model_id: 10084 },
  { name: 'Explorer ST', model_id: 10085 },
  // Expedition
  { name: 'Expedition', model_id: 10090 },
  { name: 'Expedition 3.5 EcoBoost', model_id: 10091 },
  { name: 'Expedition MAX', model_id: 10092 },
  // Bronco
  { name: 'Bronco', model_id: 10100 },
  { name: 'Bronco 2.3 EcoBoost', model_id: 10101 },
  { name: 'Bronco 2.7 EcoBoost', model_id: 10102 },
  { name: 'Bronco Sport', model_id: 10103 },
  { name: 'Bronco Raptor', model_id: 10104 },
  // Ranger
  { name: 'Ranger', model_id: 10110 },
  { name: 'Ranger 2.0', model_id: 10111 },
  { name: 'Ranger 2.2 TDCi', model_id: 10112 },
  { name: 'Ranger 2.3 EcoBoost', model_id: 10113 },
  { name: 'Ranger 3.2 TDCi', model_id: 10114 },
  { name: 'Ranger Raptor', model_id: 10115 },
  // F-150
  { name: 'F-150', model_id: 10120 },
  { name: 'F-150 2.7 EcoBoost', model_id: 10121 },
  { name: 'F-150 3.0 Diesel', model_id: 10122 },
  { name: 'F-150 3.5 EcoBoost', model_id: 10123 },
  { name: 'F-150 5.0', model_id: 10124 },
  { name: 'F-150 Raptor', model_id: 10125 },
  { name: 'F-150 Lightning', model_id: 10126 },
  // F-250 / F-350 Super Duty
  { name: 'F-250', model_id: 10130 },
  { name: 'F-350', model_id: 10131 },
  { name: 'Super Duty', model_id: 10132 },
  // Maverick
  { name: 'Maverick', model_id: 10140 },
  { name: 'Maverick 2.0 EcoBoost', model_id: 10141 },
  { name: 'Maverick Hybrid', model_id: 10142 },
  // Transit
  { name: 'Transit', model_id: 10150 },
  { name: 'Transit Custom', model_id: 10151 },
  { name: 'Transit Connect', model_id: 10152 },
  { name: 'Tourneo', model_id: 10153 },
  { name: 'Tourneo Custom', model_id: 10154 },
  { name: 'Tourneo Connect', model_id: 10155 },
  // S-MAX / Galaxy
  { name: 'S-MAX', model_id: 10160 },
  { name: 'Galaxy', model_id: 10161 },
  // C-MAX
  { name: 'C-MAX', model_id: 10165 },
  { name: 'Grand C-MAX', model_id: 10166 },
  // GT
  { name: 'GT', model_id: 10170 },
  // Другие
  { name: 'Другая модель', model_id: 10999 },
];

// Все модели Chevrolet
const CHEVROLET_MODELS: CarModel[] = [
  // Spark
  { name: 'Spark', model_id: 11001 },
  { name: 'Spark 0.8', model_id: 11002 },
  { name: 'Spark 1.0', model_id: 11003 },
  { name: 'Spark 1.2', model_id: 11004 },
  // Aveo / Sonic
  { name: 'Aveo', model_id: 11010 },
  { name: 'Aveo 1.2', model_id: 11011 },
  { name: 'Aveo 1.4', model_id: 11012 },
  { name: 'Aveo 1.6', model_id: 11013 },
  { name: 'Sonic', model_id: 11014 },
  // Cruze
  { name: 'Cruze', model_id: 11020 },
  { name: 'Cruze 1.4', model_id: 11021 },
  { name: 'Cruze 1.4 Turbo', model_id: 11022 },
  { name: 'Cruze 1.6', model_id: 11023 },
  { name: 'Cruze 1.8', model_id: 11024 },
  { name: 'Cruze 2.0 Diesel', model_id: 11025 },
  // Malibu
  { name: 'Malibu', model_id: 11030 },
  { name: 'Malibu 1.5 Turbo', model_id: 11031 },
  { name: 'Malibu 2.0 Turbo', model_id: 11032 },
  { name: 'Malibu 2.4', model_id: 11033 },
  { name: 'Malibu 2.5', model_id: 11034 },
  // Impala
  { name: 'Impala', model_id: 11040 },
  { name: 'Impala 2.5', model_id: 11041 },
  { name: 'Impala 3.6', model_id: 11042 },
  // Camaro
  { name: 'Camaro', model_id: 11050 },
  { name: 'Camaro 2.0 Turbo', model_id: 11051 },
  { name: 'Camaro 3.6', model_id: 11052 },
  { name: 'Camaro SS 6.2', model_id: 11053 },
  { name: 'Camaro ZL1', model_id: 11054 },
  { name: 'Camaro Z/28', model_id: 11055 },
  // Corvette
  { name: 'Corvette', model_id: 11060 },
  { name: 'Corvette Stingray', model_id: 11061 },
  { name: 'Corvette Z06', model_id: 11062 },
  { name: 'Corvette ZR1', model_id: 11063 },
  { name: 'Corvette E-Ray', model_id: 11064 },
  // Trax / Tracker
  { name: 'Trax', model_id: 11070 },
  { name: 'Trax 1.4 Turbo', model_id: 11071 },
  { name: 'Tracker', model_id: 11072 },
  { name: 'Tracker 1.0 Turbo', model_id: 11073 },
  { name: 'Tracker 1.2 Turbo', model_id: 11074 },
  // Trailblazer
  { name: 'Trailblazer', model_id: 11080 },
  { name: 'Trailblazer 1.2 Turbo', model_id: 11081 },
  { name: 'Trailblazer 1.3 Turbo', model_id: 11082 },
  { name: 'Trailblazer 2.5', model_id: 11083 },
  { name: 'Trailblazer 2.8 Diesel', model_id: 11084 },
  // Equinox
  { name: 'Equinox', model_id: 11090 },
  { name: 'Equinox 1.5 Turbo', model_id: 11091 },
  { name: 'Equinox 2.0 Turbo', model_id: 11092 },
  { name: 'Equinox 2.4', model_id: 11093 },
  // Blazer
  { name: 'Blazer', model_id: 11100 },
  { name: 'Blazer 2.0 Turbo', model_id: 11101 },
  { name: 'Blazer 2.5', model_id: 11102 },
  { name: 'Blazer 3.6', model_id: 11103 },
  { name: 'Blazer EV', model_id: 11104 },
  // Traverse
  { name: 'Traverse', model_id: 11110 },
  { name: 'Traverse 2.0 Turbo', model_id: 11111 },
  { name: 'Traverse 3.6', model_id: 11112 },
  // Tahoe
  { name: 'Tahoe', model_id: 11120 },
  { name: 'Tahoe 5.3', model_id: 11121 },
  { name: 'Tahoe 6.2', model_id: 11122 },
  { name: 'Tahoe 3.0 Diesel', model_id: 11123 },
  // Suburban
  { name: 'Suburban', model_id: 11130 },
  { name: 'Suburban 5.3', model_id: 11131 },
  { name: 'Suburban 6.2', model_id: 11132 },
  // Captiva
  { name: 'Captiva', model_id: 11140 },
  { name: 'Captiva 2.0 Diesel', model_id: 11141 },
  { name: 'Captiva 2.2 Diesel', model_id: 11142 },
  { name: 'Captiva 2.4', model_id: 11143 },
  { name: 'Captiva 3.0', model_id: 11144 },
  { name: 'Captiva 3.2', model_id: 11145 },
  // Orlando
  { name: 'Orlando', model_id: 11150 },
  { name: 'Orlando 1.4 Turbo', model_id: 11151 },
  { name: 'Orlando 1.8', model_id: 11152 },
  { name: 'Orlando 2.0 Diesel', model_id: 11153 },
  // Colorado
  { name: 'Colorado', model_id: 11160 },
  { name: 'Colorado 2.5', model_id: 11161 },
  { name: 'Colorado 2.8 Diesel', model_id: 11162 },
  { name: 'Colorado 3.6', model_id: 11163 },
  { name: 'Colorado ZR2', model_id: 11164 },
  // Silverado
  { name: 'Silverado', model_id: 11170 },
  { name: 'Silverado 2.7 Turbo', model_id: 11171 },
  { name: 'Silverado 3.0 Diesel', model_id: 11172 },
  { name: 'Silverado 5.3', model_id: 11173 },
  { name: 'Silverado 6.2', model_id: 11174 },
  { name: 'Silverado EV', model_id: 11175 },
  { name: 'Silverado HD', model_id: 11176 },
  // Bolt
  { name: 'Bolt EV', model_id: 11180 },
  { name: 'Bolt EUV', model_id: 11181 },
  // Lacetti / Optra
  { name: 'Lacetti', model_id: 11190 },
  { name: 'Lacetti 1.4', model_id: 11191 },
  { name: 'Lacetti 1.6', model_id: 11192 },
  { name: 'Lacetti 1.8', model_id: 11193 },
  { name: 'Optra', model_id: 11194 },
  // Epica
  { name: 'Epica', model_id: 11200 },
  { name: 'Epica 2.0', model_id: 11201 },
  { name: 'Epica 2.5', model_id: 11202 },
  // Niva
  { name: 'Niva', model_id: 11210 },
  { name: 'Niva 1.7', model_id: 11211 },
  // Lanos
  { name: 'Lanos', model_id: 11220 },
  { name: 'Lanos 1.5', model_id: 11221 },
  { name: 'Lanos 1.6', model_id: 11222 },
  // Cobalt
  { name: 'Cobalt', model_id: 11230 },
  { name: 'Cobalt 1.5', model_id: 11231 },
  // Onix
  { name: 'Onix', model_id: 11240 },
  { name: 'Onix 1.0', model_id: 11241 },
  { name: 'Onix 1.0 Turbo', model_id: 11242 },
  // Другие
  { name: 'Другая модель', model_id: 11999 },
];

// Все модели Mazda
const MAZDA_MODELS: CarModel[] = [
  // Mazda2 / Demio
  { name: 'Mazda2', model_id: 12001 },
  { name: 'Mazda2 1.3', model_id: 12002 },
  { name: 'Mazda2 1.5', model_id: 12003 },
  { name: 'Demio', model_id: 12004 },
  // Mazda3 / Axela
  { name: 'Mazda3', model_id: 12010 },
  { name: 'Mazda3 1.5', model_id: 12011 },
  { name: 'Mazda3 2.0', model_id: 12012 },
  { name: 'Mazda3 2.5', model_id: 12013 },
  { name: 'Mazda3 2.5 Turbo', model_id: 12014 },
  { name: 'Mazda3 Hatchback', model_id: 12015 },
  { name: 'Axela', model_id: 12016 },
  // Mazda6 / Atenza
  { name: 'Mazda6', model_id: 12020 },
  { name: 'Mazda6 2.0', model_id: 12021 },
  { name: 'Mazda6 2.2 Diesel', model_id: 12022 },
  { name: 'Mazda6 2.5', model_id: 12023 },
  { name: 'Mazda6 2.5 Turbo', model_id: 12024 },
  { name: 'Atenza', model_id: 12025 },
  // CX-3
  { name: 'CX-3', model_id: 12030 },
  { name: 'CX-3 1.5', model_id: 12031 },
  { name: 'CX-3 2.0', model_id: 12032 },
  // CX-30
  { name: 'CX-30', model_id: 12040 },
  { name: 'CX-30 2.0', model_id: 12041 },
  { name: 'CX-30 2.5', model_id: 12042 },
  { name: 'CX-30 2.5 Turbo', model_id: 12043 },
  // CX-5
  { name: 'CX-5', model_id: 12050 },
  { name: 'CX-5 2.0', model_id: 12051 },
  { name: 'CX-5 2.2 Diesel', model_id: 12052 },
  { name: 'CX-5 2.5', model_id: 12053 },
  { name: 'CX-5 2.5 Turbo', model_id: 12054 },
  // CX-50
  { name: 'CX-50', model_id: 12060 },
  { name: 'CX-50 2.5', model_id: 12061 },
  { name: 'CX-50 2.5 Turbo', model_id: 12062 },
  // CX-7
  { name: 'CX-7', model_id: 12070 },
  { name: 'CX-7 2.3 Turbo', model_id: 12071 },
  { name: 'CX-7 2.5', model_id: 12072 },
  // CX-8
  { name: 'CX-8', model_id: 12075 },
  // CX-9
  { name: 'CX-9', model_id: 12080 },
  { name: 'CX-9 2.5 Turbo', model_id: 12081 },
  { name: 'CX-9 3.5', model_id: 12082 },
  { name: 'CX-9 3.7', model_id: 12083 },
  // CX-60
  { name: 'CX-60', model_id: 12090 },
  { name: 'CX-60 2.5', model_id: 12091 },
  { name: 'CX-60 3.3 Diesel', model_id: 12092 },
  { name: 'CX-60 PHEV', model_id: 12093 },
  // CX-90
  { name: 'CX-90', model_id: 12100 },
  { name: 'CX-90 3.3 Turbo', model_id: 12101 },
  { name: 'CX-90 PHEV', model_id: 12102 },
  // MX-5 / Miata / Roadster
  { name: 'MX-5', model_id: 12110 },
  { name: 'MX-5 1.5', model_id: 12111 },
  { name: 'MX-5 2.0', model_id: 12112 },
  { name: 'MX-5 RF', model_id: 12113 },
  { name: 'Miata', model_id: 12114 },
  { name: 'Roadster', model_id: 12115 },
  // MX-30
  { name: 'MX-30', model_id: 12120 },
  { name: 'MX-30 EV', model_id: 12121 },
  { name: 'MX-30 R-EV', model_id: 12122 },
  // RX-7
  { name: 'RX-7', model_id: 12130 },
  // RX-8
  { name: 'RX-8', model_id: 12140 },
  // BT-50
  { name: 'BT-50', model_id: 12150 },
  { name: 'BT-50 2.2', model_id: 12151 },
  { name: 'BT-50 3.0', model_id: 12152 },
  { name: 'BT-50 3.2', model_id: 12153 },
  // MPV
  { name: 'MPV', model_id: 12160 },
  // Premacy
  { name: 'Premacy', model_id: 12170 },
  // Tribute
  { name: 'Tribute', model_id: 12180 },
  // 323 / Familia
  { name: '323', model_id: 12190 },
  { name: 'Familia', model_id: 12191 },
  // 626 / Capella
  { name: '626', model_id: 12200 },
  { name: 'Capella', model_id: 12201 },
  // Другие
  { name: 'Другая модель', model_id: 12999 },
];

// Все модели Subaru
const SUBARU_MODELS: CarModel[] = [
  // Impreza
  { name: 'Impreza', model_id: 13001 },
  { name: 'Impreza 1.5', model_id: 13002 },
  { name: 'Impreza 1.6', model_id: 13003 },
  { name: 'Impreza 2.0', model_id: 13004 },
  { name: 'Impreza WRX', model_id: 13005 },
  { name: 'Impreza WRX STI', model_id: 13006 },
  { name: 'Impreza Sport', model_id: 13007 },
  // WRX
  { name: 'WRX', model_id: 13010 },
  { name: 'WRX 2.0 Turbo', model_id: 13011 },
  { name: 'WRX 2.4 Turbo', model_id: 13012 },
  { name: 'WRX STI', model_id: 13013 },
  // Legacy
  { name: 'Legacy', model_id: 13020 },
  { name: 'Legacy 2.0', model_id: 13021 },
  { name: 'Legacy 2.4', model_id: 13022 },
  { name: 'Legacy 2.5', model_id: 13023 },
  { name: 'Legacy 3.0', model_id: 13024 },
  { name: 'Legacy 3.6', model_id: 13025 },
  { name: 'Legacy GT', model_id: 13026 },
  // Levorg
  { name: 'Levorg', model_id: 13030 },
  { name: 'Levorg 1.6 Turbo', model_id: 13031 },
  { name: 'Levorg 1.8 Turbo', model_id: 13032 },
  { name: 'Levorg 2.0 Turbo', model_id: 13033 },
  // Outback
  { name: 'Outback', model_id: 13040 },
  { name: 'Outback 2.4', model_id: 13041 },
  { name: 'Outback 2.5', model_id: 13042 },
  { name: 'Outback 2.5 Turbo', model_id: 13043 },
  { name: 'Outback 3.0', model_id: 13044 },
  { name: 'Outback 3.6', model_id: 13045 },
  // Forester
  { name: 'Forester', model_id: 13050 },
  { name: 'Forester 2.0', model_id: 13051 },
  { name: 'Forester 2.0 Turbo', model_id: 13052 },
  { name: 'Forester 2.5', model_id: 13053 },
  { name: 'Forester 2.5 Turbo', model_id: 13054 },
  { name: 'Forester e-Boxer', model_id: 13055 },
  { name: 'Forester XT', model_id: 13056 },
  // XV / Crosstrek
  { name: 'XV', model_id: 13060 },
  { name: 'XV 1.6', model_id: 13061 },
  { name: 'XV 2.0', model_id: 13062 },
  { name: 'XV e-Boxer', model_id: 13063 },
  { name: 'Crosstrek', model_id: 13064 },
  { name: 'Crosstrek 2.0', model_id: 13065 },
  { name: 'Crosstrek 2.5', model_id: 13066 },
  // Ascent
  { name: 'Ascent', model_id: 13070 },
  { name: 'Ascent 2.4 Turbo', model_id: 13071 },
  // BRZ
  { name: 'BRZ', model_id: 13080 },
  { name: 'BRZ 2.0', model_id: 13081 },
  { name: 'BRZ 2.4', model_id: 13082 },
  { name: 'BRZ tS', model_id: 13083 },
  // Solterra
  { name: 'Solterra', model_id: 13090 },
  // Tribeca
  { name: 'Tribeca', model_id: 13100 },
  { name: 'Tribeca 3.0', model_id: 13101 },
  { name: 'Tribeca 3.6', model_id: 13102 },
  // Exiga
  { name: 'Exiga', model_id: 13110 },
  // Trezia
  { name: 'Trezia', model_id: 13120 },
  // Justy
  { name: 'Justy', model_id: 13130 },
  // Другие
  { name: 'Другая модель', model_id: 13999 },
];

// Все модели Mitsubishi
const MITSUBISHI_MODELS: CarModel[] = [
  // Lancer
  { name: 'Lancer', model_id: 14001 },
  { name: 'Lancer 1.5', model_id: 14002 },
  { name: 'Lancer 1.6', model_id: 14003 },
  { name: 'Lancer 1.8', model_id: 14004 },
  { name: 'Lancer 2.0', model_id: 14005 },
  { name: 'Lancer Evolution', model_id: 14006 },
  { name: 'Lancer Evolution X', model_id: 14007 },
  // Mirage / Attrage
  { name: 'Mirage', model_id: 14010 },
  { name: 'Mirage 1.0', model_id: 14011 },
  { name: 'Mirage 1.2', model_id: 14012 },
  { name: 'Attrage', model_id: 14013 },
  // Galant
  { name: 'Galant', model_id: 14020 },
  { name: 'Galant 2.0', model_id: 14021 },
  { name: 'Galant 2.4', model_id: 14022 },
  { name: 'Galant 3.0', model_id: 14023 },
  { name: 'Galant 3.8', model_id: 14024 },
  // ASX / RVR / Outlander Sport
  { name: 'ASX', model_id: 14030 },
  { name: 'ASX 1.6', model_id: 14031 },
  { name: 'ASX 1.8', model_id: 14032 },
  { name: 'ASX 2.0', model_id: 14033 },
  { name: 'ASX 2.2 Diesel', model_id: 14034 },
  { name: 'RVR', model_id: 14035 },
  { name: 'Outlander Sport', model_id: 14036 },
  // Eclipse Cross
  { name: 'Eclipse Cross', model_id: 14040 },
  { name: 'Eclipse Cross 1.5 Turbo', model_id: 14041 },
  { name: 'Eclipse Cross 2.2 Diesel', model_id: 14042 },
  { name: 'Eclipse Cross PHEV', model_id: 14043 },
  // Outlander
  { name: 'Outlander', model_id: 14050 },
  { name: 'Outlander 2.0', model_id: 14051 },
  { name: 'Outlander 2.2 Diesel', model_id: 14052 },
  { name: 'Outlander 2.4', model_id: 14053 },
  { name: 'Outlander 3.0', model_id: 14054 },
  { name: 'Outlander PHEV', model_id: 14055 },
  { name: 'Outlander GT', model_id: 14056 },
  // Pajero / Montero / Shogun
  { name: 'Pajero', model_id: 14060 },
  { name: 'Pajero 3.0', model_id: 14061 },
  { name: 'Pajero 3.2 Diesel', model_id: 14062 },
  { name: 'Pajero 3.5', model_id: 14063 },
  { name: 'Pajero 3.8', model_id: 14064 },
  { name: 'Montero', model_id: 14065 },
  { name: 'Shogun', model_id: 14066 },
  // Pajero Sport / Challenger
  { name: 'Pajero Sport', model_id: 14070 },
  { name: 'Pajero Sport 2.4', model_id: 14071 },
  { name: 'Pajero Sport 2.5 Diesel', model_id: 14072 },
  { name: 'Pajero Sport 3.0', model_id: 14073 },
  { name: 'Challenger', model_id: 14074 },
  // Pajero Pinin / iO
  { name: 'Pajero Pinin', model_id: 14080 },
  { name: 'Pajero iO', model_id: 14081 },
  // L200 / Triton
  { name: 'L200', model_id: 14090 },
  { name: 'L200 2.4', model_id: 14091 },
  { name: 'L200 2.4 Diesel', model_id: 14092 },
  { name: 'L200 2.5 Diesel', model_id: 14093 },
  { name: 'Triton', model_id: 14094 },
  // Delica
  { name: 'Delica', model_id: 14100 },
  { name: 'Delica D:5', model_id: 14101 },
  { name: 'Delica 2.2 Diesel', model_id: 14102 },
  { name: 'Delica 2.4', model_id: 14103 },
  // Space Star
  { name: 'Space Star', model_id: 14110 },
  // Grandis
  { name: 'Grandis', model_id: 14120 },
  { name: 'Grandis 2.4', model_id: 14121 },
  // Colt
  { name: 'Colt', model_id: 14130 },
  { name: 'Colt 1.1', model_id: 14131 },
  { name: 'Colt 1.3', model_id: 14132 },
  { name: 'Colt 1.5', model_id: 14133 },
  // Carisma
  { name: 'Carisma', model_id: 14140 },
  // Space Wagon
  { name: 'Space Wagon', model_id: 14150 },
  // Eclipse
  { name: 'Eclipse', model_id: 14160 },
  { name: 'Eclipse 2.0', model_id: 14161 },
  { name: 'Eclipse 2.4', model_id: 14162 },
  { name: 'Eclipse 3.0', model_id: 14163 },
  // 3000GT / GTO
  { name: '3000GT', model_id: 14170 },
  { name: 'GTO', model_id: 14171 },
  // i-MiEV
  { name: 'i-MiEV', model_id: 14180 },
  // Xpander
  { name: 'Xpander', model_id: 14190 },
  { name: 'Xpander 1.5', model_id: 14191 },
  { name: 'Xpander Cross', model_id: 14192 },
  // Другие
  { name: 'Другая модель', model_id: 14999 },
];

// Все модели Porsche
const PORSCHE_MODELS: CarModel[] = [
  // 911
  { name: '911', model_id: 15001 },
  { name: '911 Carrera', model_id: 15002 },
  { name: '911 Carrera S', model_id: 15003 },
  { name: '911 Carrera 4', model_id: 15004 },
  { name: '911 Carrera 4S', model_id: 15005 },
  { name: '911 Carrera GTS', model_id: 15006 },
  { name: '911 Targa', model_id: 15007 },
  { name: '911 Targa 4', model_id: 15008 },
  { name: '911 Targa 4S', model_id: 15009 },
  { name: '911 Turbo', model_id: 15010 },
  { name: '911 Turbo S', model_id: 15011 },
  { name: '911 GT3', model_id: 15012 },
  { name: '911 GT3 RS', model_id: 15013 },
  { name: '911 GT2 RS', model_id: 15014 },
  { name: '911 Dakar', model_id: 15015 },
  { name: '911 Sport Classic', model_id: 15016 },
  // 718 Cayman / Boxster
  { name: '718 Cayman', model_id: 15020 },
  { name: '718 Cayman S', model_id: 15021 },
  { name: '718 Cayman GTS', model_id: 15022 },
  { name: '718 Cayman GT4', model_id: 15023 },
  { name: '718 Cayman GT4 RS', model_id: 15024 },
  { name: '718 Boxster', model_id: 15025 },
  { name: '718 Boxster S', model_id: 15026 },
  { name: '718 Boxster GTS', model_id: 15027 },
  { name: '718 Spyder', model_id: 15028 },
  { name: 'Cayman', model_id: 15029 },
  { name: 'Boxster', model_id: 15030 },
  // Panamera
  { name: 'Panamera', model_id: 15040 },
  { name: 'Panamera 4', model_id: 15041 },
  { name: 'Panamera 4S', model_id: 15042 },
  { name: 'Panamera GTS', model_id: 15043 },
  { name: 'Panamera Turbo', model_id: 15044 },
  { name: 'Panamera Turbo S', model_id: 15045 },
  { name: 'Panamera 4 E-Hybrid', model_id: 15046 },
  { name: 'Panamera Turbo S E-Hybrid', model_id: 15047 },
  { name: 'Panamera Sport Turismo', model_id: 15048 },
  // Taycan
  { name: 'Taycan', model_id: 15050 },
  { name: 'Taycan 4S', model_id: 15051 },
  { name: 'Taycan GTS', model_id: 15052 },
  { name: 'Taycan Turbo', model_id: 15053 },
  { name: 'Taycan Turbo S', model_id: 15054 },
  { name: 'Taycan Cross Turismo', model_id: 15055 },
  { name: 'Taycan Sport Turismo', model_id: 15056 },
  // Macan
  { name: 'Macan', model_id: 15060 },
  { name: 'Macan S', model_id: 15061 },
  { name: 'Macan GTS', model_id: 15062 },
  { name: 'Macan Turbo', model_id: 15063 },
  { name: 'Macan T', model_id: 15064 },
  { name: 'Macan Electric', model_id: 15065 },
  // Cayenne
  { name: 'Cayenne', model_id: 15070 },
  { name: 'Cayenne S', model_id: 15071 },
  { name: 'Cayenne GTS', model_id: 15072 },
  { name: 'Cayenne Turbo', model_id: 15073 },
  { name: 'Cayenne Turbo S', model_id: 15074 },
  { name: 'Cayenne Turbo GT', model_id: 15075 },
  { name: 'Cayenne E-Hybrid', model_id: 15076 },
  { name: 'Cayenne Turbo S E-Hybrid', model_id: 15077 },
  { name: 'Cayenne Coupe', model_id: 15078 },
  // Другие
  { name: 'Другая модель', model_id: 15999 },
];

// Все модели Land Rover
const LAND_ROVER_MODELS: CarModel[] = [
  // Defender
  { name: 'Defender', model_id: 16001 },
  { name: 'Defender 90', model_id: 16002 },
  { name: 'Defender 110', model_id: 16003 },
  { name: 'Defender 130', model_id: 16004 },
  { name: 'Defender V8', model_id: 16005 },
  { name: 'Defender P300', model_id: 16006 },
  { name: 'Defender P400', model_id: 16007 },
  { name: 'Defender D250', model_id: 16008 },
  { name: 'Defender D300', model_id: 16009 },
  // Discovery
  { name: 'Discovery', model_id: 16020 },
  { name: 'Discovery 2.0 Si4', model_id: 16021 },
  { name: 'Discovery 3.0 Td6', model_id: 16022 },
  { name: 'Discovery 3.0 Si6', model_id: 16023 },
  { name: 'Discovery 4.4', model_id: 16024 },
  { name: 'Discovery 5.0', model_id: 16025 },
  { name: 'Discovery 3', model_id: 16026 },
  { name: 'Discovery 4', model_id: 16027 },
  { name: 'Discovery 5', model_id: 16028 },
  // Discovery Sport
  { name: 'Discovery Sport', model_id: 16030 },
  { name: 'Discovery Sport 2.0 Si4', model_id: 16031 },
  { name: 'Discovery Sport 2.0 Td4', model_id: 16032 },
  { name: 'Discovery Sport P200', model_id: 16033 },
  { name: 'Discovery Sport P250', model_id: 16034 },
  { name: 'Discovery Sport D165', model_id: 16035 },
  { name: 'Discovery Sport D200', model_id: 16036 },
  // Range Rover
  { name: 'Range Rover', model_id: 16040 },
  { name: 'Range Rover 3.0 Td6', model_id: 16041 },
  { name: 'Range Rover 3.0 Si6', model_id: 16042 },
  { name: 'Range Rover 4.4 SDV8', model_id: 16043 },
  { name: 'Range Rover 5.0 V8', model_id: 16044 },
  { name: 'Range Rover P400', model_id: 16045 },
  { name: 'Range Rover P530', model_id: 16046 },
  { name: 'Range Rover D300', model_id: 16047 },
  { name: 'Range Rover D350', model_id: 16048 },
  { name: 'Range Rover PHEV', model_id: 16049 },
  { name: 'Range Rover SV', model_id: 16050 },
  { name: 'Range Rover Autobiography', model_id: 16051 },
  { name: 'Range Rover LWB', model_id: 16052 },
  // Range Rover Sport
  { name: 'Range Rover Sport', model_id: 16060 },
  { name: 'Range Rover Sport 3.0 Td6', model_id: 16061 },
  { name: 'Range Rover Sport 3.0 Si6', model_id: 16062 },
  { name: 'Range Rover Sport 4.4 SDV8', model_id: 16063 },
  { name: 'Range Rover Sport 5.0 V8', model_id: 16064 },
  { name: 'Range Rover Sport P400', model_id: 16065 },
  { name: 'Range Rover Sport P530', model_id: 16066 },
  { name: 'Range Rover Sport SVR', model_id: 16067 },
  { name: 'Range Rover Sport PHEV', model_id: 16068 },
  // Range Rover Velar
  { name: 'Range Rover Velar', model_id: 16070 },
  { name: 'Range Rover Velar P250', model_id: 16071 },
  { name: 'Range Rover Velar P340', model_id: 16072 },
  { name: 'Range Rover Velar P380', model_id: 16073 },
  { name: 'Range Rover Velar D180', model_id: 16074 },
  { name: 'Range Rover Velar D240', model_id: 16075 },
  { name: 'Range Rover Velar D300', model_id: 16076 },
  { name: 'Range Rover Velar SVAutobiography', model_id: 16077 },
  // Range Rover Evoque
  { name: 'Range Rover Evoque', model_id: 16080 },
  { name: 'Range Rover Evoque 2.0 Si4', model_id: 16081 },
  { name: 'Range Rover Evoque 2.0 Td4', model_id: 16082 },
  { name: 'Range Rover Evoque P200', model_id: 16083 },
  { name: 'Range Rover Evoque P250', model_id: 16084 },
  { name: 'Range Rover Evoque P300', model_id: 16085 },
  { name: 'Range Rover Evoque D150', model_id: 16086 },
  { name: 'Range Rover Evoque D200', model_id: 16087 },
  // Freelander
  { name: 'Freelander', model_id: 16090 },
  { name: 'Freelander 2', model_id: 16091 },
  { name: 'Freelander 2.0', model_id: 16092 },
  { name: 'Freelander 2.2 Td4', model_id: 16093 },
  { name: 'Freelander 3.2', model_id: 16094 },
  // Другие
  { name: 'Другая модель', model_id: 16999 },
];

// Все модели Jeep
const JEEP_MODELS: CarModel[] = [
  // Renegade
  { name: 'Renegade', model_id: 17001 },
  { name: 'Renegade 1.0', model_id: 17002 },
  { name: 'Renegade 1.3', model_id: 17003 },
  { name: 'Renegade 1.4', model_id: 17004 },
  { name: 'Renegade 1.6', model_id: 17005 },
  { name: 'Renegade 2.4', model_id: 17006 },
  { name: 'Renegade Trailhawk', model_id: 17007 },
  { name: 'Renegade 4xe', model_id: 17008 },
  // Compass
  { name: 'Compass', model_id: 17010 },
  { name: 'Compass 1.3', model_id: 17011 },
  { name: 'Compass 1.4', model_id: 17012 },
  { name: 'Compass 2.0', model_id: 17013 },
  { name: 'Compass 2.4', model_id: 17014 },
  { name: 'Compass Trailhawk', model_id: 17015 },
  { name: 'Compass 4xe', model_id: 17016 },
  // Cherokee
  { name: 'Cherokee', model_id: 17020 },
  { name: 'Cherokee 2.0 Turbo', model_id: 17021 },
  { name: 'Cherokee 2.4', model_id: 17022 },
  { name: 'Cherokee 3.2', model_id: 17023 },
  { name: 'Cherokee Trailhawk', model_id: 17024 },
  // Grand Cherokee
  { name: 'Grand Cherokee', model_id: 17030 },
  { name: 'Grand Cherokee 3.0 CRD', model_id: 17031 },
  { name: 'Grand Cherokee 3.0 V6', model_id: 17032 },
  { name: 'Grand Cherokee 3.6', model_id: 17033 },
  { name: 'Grand Cherokee 5.7', model_id: 17034 },
  { name: 'Grand Cherokee 6.2', model_id: 17035 },
  { name: 'Grand Cherokee 6.4 SRT', model_id: 17036 },
  { name: 'Grand Cherokee Trackhawk', model_id: 17037 },
  { name: 'Grand Cherokee Trailhawk', model_id: 17038 },
  { name: 'Grand Cherokee 4xe', model_id: 17039 },
  { name: 'Grand Cherokee L', model_id: 17040 },
  { name: 'Grand Cherokee Summit', model_id: 17041 },
  // Wrangler
  { name: 'Wrangler', model_id: 17050 },
  { name: 'Wrangler 2.0 Turbo', model_id: 17051 },
  { name: 'Wrangler 2.2 CRD', model_id: 17052 },
  { name: 'Wrangler 3.0 EcoDiesel', model_id: 17053 },
  { name: 'Wrangler 3.6', model_id: 17054 },
  { name: 'Wrangler 6.4 Rubicon 392', model_id: 17055 },
  { name: 'Wrangler Rubicon', model_id: 17056 },
  { name: 'Wrangler Sahara', model_id: 17057 },
  { name: 'Wrangler Sport', model_id: 17058 },
  { name: 'Wrangler 4xe', model_id: 17059 },
  { name: 'Wrangler Unlimited', model_id: 17060 },
  // Gladiator
  { name: 'Gladiator', model_id: 17070 },
  { name: 'Gladiator 3.0 EcoDiesel', model_id: 17071 },
  { name: 'Gladiator 3.6', model_id: 17072 },
  { name: 'Gladiator Rubicon', model_id: 17073 },
  { name: 'Gladiator Mojave', model_id: 17074 },
  // Commander
  { name: 'Commander', model_id: 17080 },
  { name: 'Commander 2.0 Turbo', model_id: 17081 },
  { name: 'Commander 3.6', model_id: 17082 },
  // Patriot
  { name: 'Patriot', model_id: 17090 },
  { name: 'Patriot 2.0', model_id: 17091 },
  { name: 'Patriot 2.4', model_id: 17092 },
  // Liberty
  { name: 'Liberty', model_id: 17100 },
  { name: 'Liberty 2.4', model_id: 17101 },
  { name: 'Liberty 2.8 CRD', model_id: 17102 },
  { name: 'Liberty 3.7', model_id: 17103 },
  // Wagoneer / Grand Wagoneer
  { name: 'Wagoneer', model_id: 17110 },
  { name: 'Wagoneer 3.0 Turbo', model_id: 17111 },
  { name: 'Grand Wagoneer', model_id: 17112 },
  { name: 'Grand Wagoneer 3.0 Turbo', model_id: 17113 },
  { name: 'Grand Wagoneer 6.4', model_id: 17114 },
  // Avenger
  { name: 'Avenger', model_id: 17120 },
  { name: 'Avenger Electric', model_id: 17121 },
  // Другие
  { name: 'Другая модель', model_id: 17999 },
];

// Все модели Volvo
const VOLVO_MODELS: CarModel[] = [
  // S40
  { name: 'S40', model_id: 18001 },
  { name: 'S40 1.6', model_id: 18002 },
  { name: 'S40 1.8', model_id: 18003 },
  { name: 'S40 2.0', model_id: 18004 },
  { name: 'S40 2.4', model_id: 18005 },
  { name: 'S40 T5', model_id: 18006 },
  // S60
  { name: 'S60', model_id: 18010 },
  { name: 'S60 2.0 T', model_id: 18011 },
  { name: 'S60 2.0 D', model_id: 18012 },
  { name: 'S60 T4', model_id: 18013 },
  { name: 'S60 T5', model_id: 18014 },
  { name: 'S60 T6', model_id: 18015 },
  { name: 'S60 T8', model_id: 18016 },
  { name: 'S60 Recharge', model_id: 18017 },
  { name: 'S60 Polestar', model_id: 18018 },
  // S80
  { name: 'S80', model_id: 18020 },
  { name: 'S80 2.0 T', model_id: 18021 },
  { name: 'S80 2.4', model_id: 18022 },
  { name: 'S80 2.5 T', model_id: 18023 },
  { name: 'S80 3.2', model_id: 18024 },
  { name: 'S80 T6', model_id: 18025 },
  { name: 'S80 D5', model_id: 18026 },
  // S90
  { name: 'S90', model_id: 18030 },
  { name: 'S90 T4', model_id: 18031 },
  { name: 'S90 T5', model_id: 18032 },
  { name: 'S90 T6', model_id: 18033 },
  { name: 'S90 T8', model_id: 18034 },
  { name: 'S90 D4', model_id: 18035 },
  { name: 'S90 D5', model_id: 18036 },
  { name: 'S90 Recharge', model_id: 18037 },
  // V40
  { name: 'V40', model_id: 18040 },
  { name: 'V40 T2', model_id: 18041 },
  { name: 'V40 T3', model_id: 18042 },
  { name: 'V40 T4', model_id: 18043 },
  { name: 'V40 T5', model_id: 18044 },
  { name: 'V40 D2', model_id: 18045 },
  { name: 'V40 D3', model_id: 18046 },
  { name: 'V40 D4', model_id: 18047 },
  { name: 'V40 Cross Country', model_id: 18048 },
  // V50
  { name: 'V50', model_id: 18050 },
  { name: 'V50 1.6', model_id: 18051 },
  { name: 'V50 1.8', model_id: 18052 },
  { name: 'V50 2.0', model_id: 18053 },
  { name: 'V50 2.4', model_id: 18054 },
  { name: 'V50 T5', model_id: 18055 },
  // V60
  { name: 'V60', model_id: 18060 },
  { name: 'V60 T4', model_id: 18061 },
  { name: 'V60 T5', model_id: 18062 },
  { name: 'V60 T6', model_id: 18063 },
  { name: 'V60 T8', model_id: 18064 },
  { name: 'V60 D3', model_id: 18065 },
  { name: 'V60 D4', model_id: 18066 },
  { name: 'V60 D5', model_id: 18067 },
  { name: 'V60 Cross Country', model_id: 18068 },
  { name: 'V60 Recharge', model_id: 18069 },
  { name: 'V60 Polestar', model_id: 18070 },
  // V70
  { name: 'V70', model_id: 18075 },
  { name: 'V70 2.0 T', model_id: 18076 },
  { name: 'V70 2.4', model_id: 18077 },
  { name: 'V70 2.5 T', model_id: 18078 },
  { name: 'V70 3.2', model_id: 18079 },
  { name: 'V70 T6', model_id: 18080 },
  { name: 'V70 D5', model_id: 18081 },
  // V90
  { name: 'V90', model_id: 18085 },
  { name: 'V90 T5', model_id: 18086 },
  { name: 'V90 T6', model_id: 18087 },
  { name: 'V90 T8', model_id: 18088 },
  { name: 'V90 D4', model_id: 18089 },
  { name: 'V90 D5', model_id: 18090 },
  { name: 'V90 Cross Country', model_id: 18091 },
  { name: 'V90 Recharge', model_id: 18092 },
  // XC40
  { name: 'XC40', model_id: 18100 },
  { name: 'XC40 T3', model_id: 18101 },
  { name: 'XC40 T4', model_id: 18102 },
  { name: 'XC40 T5', model_id: 18103 },
  { name: 'XC40 D3', model_id: 18104 },
  { name: 'XC40 D4', model_id: 18105 },
  { name: 'XC40 Recharge', model_id: 18106 },
  // XC60
  { name: 'XC60', model_id: 18110 },
  { name: 'XC60 T4', model_id: 18111 },
  { name: 'XC60 T5', model_id: 18112 },
  { name: 'XC60 T6', model_id: 18113 },
  { name: 'XC60 T8', model_id: 18114 },
  { name: 'XC60 D3', model_id: 18115 },
  { name: 'XC60 D4', model_id: 18116 },
  { name: 'XC60 D5', model_id: 18117 },
  { name: 'XC60 Recharge', model_id: 18118 },
  // XC70
  { name: 'XC70', model_id: 18120 },
  { name: 'XC70 2.5 T', model_id: 18121 },
  { name: 'XC70 3.2', model_id: 18122 },
  { name: 'XC70 T6', model_id: 18123 },
  { name: 'XC70 D5', model_id: 18124 },
  // XC90
  { name: 'XC90', model_id: 18130 },
  { name: 'XC90 T5', model_id: 18131 },
  { name: 'XC90 T6', model_id: 18132 },
  { name: 'XC90 T8', model_id: 18133 },
  { name: 'XC90 D4', model_id: 18134 },
  { name: 'XC90 D5', model_id: 18135 },
  { name: 'XC90 Recharge', model_id: 18136 },
  // C30
  { name: 'C30', model_id: 18140 },
  { name: 'C30 1.6', model_id: 18141 },
  { name: 'C30 2.0', model_id: 18142 },
  { name: 'C30 T5', model_id: 18143 },
  // C40
  { name: 'C40 Recharge', model_id: 18150 },
  // C70
  { name: 'C70', model_id: 18155 },
  { name: 'C70 T5', model_id: 18156 },
  // EX30
  { name: 'EX30', model_id: 18160 },
  // EX90
  { name: 'EX90', model_id: 18165 },
  // Другие
  { name: 'Другая модель', model_id: 18999 },
];

// Все модели Peugeot
const PEUGEOT_MODELS: CarModel[] = [
  // 108
  { name: '108', model_id: 19001 },
  { name: '108 1.0', model_id: 19002 },
  { name: '108 1.2', model_id: 19003 },
  // 208
  { name: '208', model_id: 19010 },
  { name: '208 1.0', model_id: 19011 },
  { name: '208 1.2', model_id: 19012 },
  { name: '208 1.2 PureTech', model_id: 19013 },
  { name: '208 1.5 BlueHDi', model_id: 19014 },
  { name: '208 1.6', model_id: 19015 },
  { name: '208 GTi', model_id: 19016 },
  { name: 'e-208', model_id: 19017 },
  // 308
  { name: '308', model_id: 19020 },
  { name: '308 1.2 PureTech', model_id: 19021 },
  { name: '308 1.5 BlueHDi', model_id: 19022 },
  { name: '308 1.6', model_id: 19023 },
  { name: '308 1.6 THP', model_id: 19024 },
  { name: '308 2.0 BlueHDi', model_id: 19025 },
  { name: '308 GTi', model_id: 19026 },
  { name: '308 SW', model_id: 19027 },
  { name: 'e-308', model_id: 19028 },
  // 408
  { name: '408', model_id: 19030 },
  { name: '408 1.2 PureTech', model_id: 19031 },
  { name: '408 1.6 PHEV', model_id: 19032 },
  // 508
  { name: '508', model_id: 19040 },
  { name: '508 1.5 BlueHDi', model_id: 19041 },
  { name: '508 1.6 PureTech', model_id: 19042 },
  { name: '508 2.0 BlueHDi', model_id: 19043 },
  { name: '508 SW', model_id: 19044 },
  { name: '508 GT', model_id: 19045 },
  { name: '508 PSE', model_id: 19046 },
  { name: '508 Hybrid', model_id: 19047 },
  // 2008
  { name: '2008', model_id: 19050 },
  { name: '2008 1.2 PureTech', model_id: 19051 },
  { name: '2008 1.5 BlueHDi', model_id: 19052 },
  { name: '2008 1.6', model_id: 19053 },
  { name: 'e-2008', model_id: 19054 },
  // 3008
  { name: '3008', model_id: 19060 },
  { name: '3008 1.2 PureTech', model_id: 19061 },
  { name: '3008 1.5 BlueHDi', model_id: 19062 },
  { name: '3008 1.6 THP', model_id: 19063 },
  { name: '3008 2.0 BlueHDi', model_id: 19064 },
  { name: '3008 Hybrid', model_id: 19065 },
  { name: '3008 Hybrid4', model_id: 19066 },
  // 4008
  { name: '4008', model_id: 19070 },
  // 5008
  { name: '5008', model_id: 19080 },
  { name: '5008 1.2 PureTech', model_id: 19081 },
  { name: '5008 1.5 BlueHDi', model_id: 19082 },
  { name: '5008 1.6 THP', model_id: 19083 },
  { name: '5008 2.0 BlueHDi', model_id: 19084 },
  { name: '5008 Hybrid', model_id: 19085 },
  // Rifter / Partner
  { name: 'Rifter', model_id: 19090 },
  { name: 'Partner', model_id: 19091 },
  { name: 'Partner Tepee', model_id: 19092 },
  // Traveller / Expert
  { name: 'Traveller', model_id: 19100 },
  { name: 'Expert', model_id: 19101 },
  // Boxer
  { name: 'Boxer', model_id: 19110 },
  // 206
  { name: '206', model_id: 19120 },
  { name: '206 1.4', model_id: 19121 },
  { name: '206 1.6', model_id: 19122 },
  { name: '206 2.0', model_id: 19123 },
  { name: '206 GTi', model_id: 19124 },
  { name: '206 CC', model_id: 19125 },
  // 207
  { name: '207', model_id: 19130 },
  { name: '207 1.4', model_id: 19131 },
  { name: '207 1.6', model_id: 19132 },
  { name: '207 GTi', model_id: 19133 },
  { name: '207 CC', model_id: 19134 },
  // 307
  { name: '307', model_id: 19140 },
  { name: '307 1.6', model_id: 19141 },
  { name: '307 2.0', model_id: 19142 },
  { name: '307 CC', model_id: 19143 },
  { name: '307 SW', model_id: 19144 },
  // 407
  { name: '407', model_id: 19150 },
  { name: '407 2.0', model_id: 19151 },
  { name: '407 2.2', model_id: 19152 },
  { name: '407 3.0', model_id: 19153 },
  { name: '407 Coupe', model_id: 19154 },
  // RCZ
  { name: 'RCZ', model_id: 19160 },
  { name: 'RCZ 1.6 THP', model_id: 19161 },
  { name: 'RCZ R', model_id: 19162 },
  // Другие
  { name: 'Другая модель', model_id: 19999 },
];

// Все модели Renault
const RENAULT_MODELS: CarModel[] = [
  // Clio
  { name: 'Clio', model_id: 20001 },
  { name: 'Clio 1.0 TCe', model_id: 20002 },
  { name: 'Clio 1.2', model_id: 20003 },
  { name: 'Clio 1.5 dCi', model_id: 20004 },
  { name: 'Clio 1.6', model_id: 20005 },
  { name: 'Clio RS', model_id: 20006 },
  { name: 'Clio E-Tech', model_id: 20007 },
  // Megane
  { name: 'Megane', model_id: 20010 },
  { name: 'Megane 1.2 TCe', model_id: 20011 },
  { name: 'Megane 1.3 TCe', model_id: 20012 },
  { name: 'Megane 1.5 dCi', model_id: 20013 },
  { name: 'Megane 1.6', model_id: 20014 },
  { name: 'Megane 2.0', model_id: 20015 },
  { name: 'Megane RS', model_id: 20016 },
  { name: 'Megane GT', model_id: 20017 },
  { name: 'Megane E-Tech', model_id: 20018 },
  { name: 'Megane Grandtour', model_id: 20019 },
  // Talisman
  { name: 'Talisman', model_id: 20020 },
  { name: 'Talisman 1.3 TCe', model_id: 20021 },
  { name: 'Talisman 1.6 TCe', model_id: 20022 },
  { name: 'Talisman 1.5 dCi', model_id: 20023 },
  { name: 'Talisman 2.0 dCi', model_id: 20024 },
  { name: 'Talisman Grandtour', model_id: 20025 },
  // Laguna
  { name: 'Laguna', model_id: 20030 },
  { name: 'Laguna 1.6', model_id: 20031 },
  { name: 'Laguna 2.0', model_id: 20032 },
  { name: 'Laguna 2.0 dCi', model_id: 20033 },
  { name: 'Laguna Coupe', model_id: 20034 },
  // Fluence
  { name: 'Fluence', model_id: 20040 },
  { name: 'Fluence 1.6', model_id: 20041 },
  { name: 'Fluence 2.0', model_id: 20042 },
  // Captur
  { name: 'Captur', model_id: 20050 },
  { name: 'Captur 0.9 TCe', model_id: 20051 },
  { name: 'Captur 1.0 TCe', model_id: 20052 },
  { name: 'Captur 1.2 TCe', model_id: 20053 },
  { name: 'Captur 1.3 TCe', model_id: 20054 },
  { name: 'Captur 1.5 dCi', model_id: 20055 },
  { name: 'Captur E-Tech', model_id: 20056 },
  // Kadjar
  { name: 'Kadjar', model_id: 20060 },
  { name: 'Kadjar 1.2 TCe', model_id: 20061 },
  { name: 'Kadjar 1.3 TCe', model_id: 20062 },
  { name: 'Kadjar 1.5 dCi', model_id: 20063 },
  { name: 'Kadjar 1.6 dCi', model_id: 20064 },
  // Koleos
  { name: 'Koleos', model_id: 20070 },
  { name: 'Koleos 2.0 dCi', model_id: 20071 },
  { name: 'Koleos 2.5', model_id: 20072 },
  // Arkana
  { name: 'Arkana', model_id: 20080 },
  { name: 'Arkana 1.3 TCe', model_id: 20081 },
  { name: 'Arkana 1.6 TCe', model_id: 20082 },
  { name: 'Arkana E-Tech', model_id: 20083 },
  // Austral
  { name: 'Austral', model_id: 20085 },
  { name: 'Austral E-Tech', model_id: 20086 },
  // Espace
  { name: 'Espace', model_id: 20090 },
  { name: 'Espace 1.6 TCe', model_id: 20091 },
  { name: 'Espace 2.0 dCi', model_id: 20092 },
  { name: 'Espace E-Tech', model_id: 20093 },
  // Scenic
  { name: 'Scenic', model_id: 20100 },
  { name: 'Scenic 1.2 TCe', model_id: 20101 },
  { name: 'Scenic 1.3 TCe', model_id: 20102 },
  { name: 'Scenic 1.5 dCi', model_id: 20103 },
  { name: 'Scenic 1.6 dCi', model_id: 20104 },
  { name: 'Grand Scenic', model_id: 20105 },
  // Kangoo
  { name: 'Kangoo', model_id: 20110 },
  { name: 'Kangoo 1.5 dCi', model_id: 20111 },
  { name: 'Kangoo E-Tech', model_id: 20112 },
  // Trafic
  { name: 'Trafic', model_id: 20120 },
  { name: 'Trafic 1.6 dCi', model_id: 20121 },
  { name: 'Trafic 2.0 dCi', model_id: 20122 },
  // Master
  { name: 'Master', model_id: 20130 },
  // Duster
  { name: 'Duster', model_id: 20140 },
  { name: 'Duster 1.0 TCe', model_id: 20141 },
  { name: 'Duster 1.3 TCe', model_id: 20142 },
  { name: 'Duster 1.5 dCi', model_id: 20143 },
  { name: 'Duster 1.6', model_id: 20144 },
  { name: 'Duster 2.0', model_id: 20145 },
  // Sandero
  { name: 'Sandero', model_id: 20150 },
  { name: 'Sandero 0.9 TCe', model_id: 20151 },
  { name: 'Sandero 1.0', model_id: 20152 },
  { name: 'Sandero 1.0 TCe', model_id: 20153 },
  { name: 'Sandero Stepway', model_id: 20154 },
  // Logan
  { name: 'Logan', model_id: 20160 },
  { name: 'Logan 1.0', model_id: 20161 },
  { name: 'Logan 1.0 TCe', model_id: 20162 },
  { name: 'Logan 1.5 dCi', model_id: 20163 },
  { name: 'Logan MCV', model_id: 20164 },
  // Twingo
  { name: 'Twingo', model_id: 20170 },
  { name: 'Twingo 1.0', model_id: 20171 },
  { name: 'Twingo E-Tech', model_id: 20172 },
  // Zoe
  { name: 'Zoe', model_id: 20180 },
  // Megane E-Tech Electric
  { name: 'Megane E-Tech Electric', model_id: 20185 },
  // Другие
  { name: 'Другая модель', model_id: 20999 },
];

// Все модели Skoda
const SKODA_MODELS: CarModel[] = [
  // Fabia
  { name: 'Fabia', model_id: 21001 },
  { name: 'Fabia 1.0', model_id: 21002 },
  { name: 'Fabia 1.0 TSI', model_id: 21003 },
  { name: 'Fabia 1.2', model_id: 21004 },
  { name: 'Fabia 1.2 TSI', model_id: 21005 },
  { name: 'Fabia 1.4', model_id: 21006 },
  { name: 'Fabia 1.4 TSI', model_id: 21007 },
  { name: 'Fabia Combi', model_id: 21008 },
  { name: 'Fabia RS', model_id: 21009 },
  // Scala
  { name: 'Scala', model_id: 21010 },
  { name: 'Scala 1.0 TSI', model_id: 21011 },
  { name: 'Scala 1.5 TSI', model_id: 21012 },
  // Rapid
  { name: 'Rapid', model_id: 21020 },
  { name: 'Rapid 1.0 TSI', model_id: 21021 },
  { name: 'Rapid 1.2 TSI', model_id: 21022 },
  { name: 'Rapid 1.4 TSI', model_id: 21023 },
  { name: 'Rapid 1.6', model_id: 21024 },
  { name: 'Rapid Spaceback', model_id: 21025 },
  // Octavia
  { name: 'Octavia', model_id: 21030 },
  { name: 'Octavia 1.0 TSI', model_id: 21031 },
  { name: 'Octavia 1.4 TSI', model_id: 21032 },
  { name: 'Octavia 1.5 TSI', model_id: 21033 },
  { name: 'Octavia 1.8 TSI', model_id: 21034 },
  { name: 'Octavia 2.0 TSI', model_id: 21035 },
  { name: 'Octavia 1.6 TDI', model_id: 21036 },
  { name: 'Octavia 2.0 TDI', model_id: 21037 },
  { name: 'Octavia Combi', model_id: 21038 },
  { name: 'Octavia Scout', model_id: 21039 },
  { name: 'Octavia RS', model_id: 21040 },
  { name: 'Octavia iV', model_id: 21041 },
  // Superb
  { name: 'Superb', model_id: 21050 },
  { name: 'Superb 1.4 TSI', model_id: 21051 },
  { name: 'Superb 1.8 TSI', model_id: 21052 },
  { name: 'Superb 2.0 TSI', model_id: 21053 },
  { name: 'Superb 1.6 TDI', model_id: 21054 },
  { name: 'Superb 2.0 TDI', model_id: 21055 },
  { name: 'Superb Combi', model_id: 21056 },
  { name: 'Superb iV', model_id: 21057 },
  // Kamiq
  { name: 'Kamiq', model_id: 21060 },
  { name: 'Kamiq 1.0 TSI', model_id: 21061 },
  { name: 'Kamiq 1.5 TSI', model_id: 21062 },
  // Karoq
  { name: 'Karoq', model_id: 21070 },
  { name: 'Karoq 1.0 TSI', model_id: 21071 },
  { name: 'Karoq 1.5 TSI', model_id: 21072 },
  { name: 'Karoq 2.0 TSI', model_id: 21073 },
  { name: 'Karoq 1.6 TDI', model_id: 21074 },
  { name: 'Karoq 2.0 TDI', model_id: 21075 },
  { name: 'Karoq Scout', model_id: 21076 },
  { name: 'Karoq Sportline', model_id: 21077 },
  // Kodiaq
  { name: 'Kodiaq', model_id: 21080 },
  { name: 'Kodiaq 1.4 TSI', model_id: 21081 },
  { name: 'Kodiaq 1.5 TSI', model_id: 21082 },
  { name: 'Kodiaq 2.0 TSI', model_id: 21083 },
  { name: 'Kodiaq 2.0 TDI', model_id: 21084 },
  { name: 'Kodiaq Scout', model_id: 21085 },
  { name: 'Kodiaq Sportline', model_id: 21086 },
  { name: 'Kodiaq RS', model_id: 21087 },
  // Yeti
  { name: 'Yeti', model_id: 21090 },
  { name: 'Yeti 1.2 TSI', model_id: 21091 },
  { name: 'Yeti 1.4 TSI', model_id: 21092 },
  { name: 'Yeti 1.8 TSI', model_id: 21093 },
  { name: 'Yeti 2.0 TDI', model_id: 21094 },
  // Roomster
  { name: 'Roomster', model_id: 21100 },
  { name: 'Roomster 1.2', model_id: 21101 },
  { name: 'Roomster 1.4', model_id: 21102 },
  { name: 'Roomster 1.6', model_id: 21103 },
  // Enyaq
  { name: 'Enyaq iV', model_id: 21110 },
  { name: 'Enyaq iV 50', model_id: 21111 },
  { name: 'Enyaq iV 60', model_id: 21112 },
  { name: 'Enyaq iV 80', model_id: 21113 },
  { name: 'Enyaq iV 80x', model_id: 21114 },
  { name: 'Enyaq RS iV', model_id: 21115 },
  { name: 'Enyaq Coupe iV', model_id: 21116 },
  // Другие
  { name: 'Другая модель', model_id: 21999 },
];

// Все модели Infiniti
const INFINITI_MODELS: CarModel[] = [
  // Q30
  { name: 'Q30', model_id: 22001 },
  { name: 'Q30 1.5d', model_id: 22002 },
  { name: 'Q30 1.6t', model_id: 22003 },
  { name: 'Q30 2.0t', model_id: 22004 },
  { name: 'Q30 2.2d', model_id: 22005 },
  // Q50
  { name: 'Q50', model_id: 22010 },
  { name: 'Q50 2.0t', model_id: 22011 },
  { name: 'Q50 2.2d', model_id: 22012 },
  { name: 'Q50 3.0t', model_id: 22013 },
  { name: 'Q50 3.5 Hybrid', model_id: 22014 },
  { name: 'Q50 Red Sport 400', model_id: 22015 },
  // Q60
  { name: 'Q60', model_id: 22020 },
  { name: 'Q60 2.0t', model_id: 22021 },
  { name: 'Q60 3.0t', model_id: 22022 },
  { name: 'Q60 Red Sport 400', model_id: 22023 },
  // Q70
  { name: 'Q70', model_id: 22030 },
  { name: 'Q70 2.5', model_id: 22031 },
  { name: 'Q70 3.5', model_id: 22032 },
  { name: 'Q70 3.7', model_id: 22033 },
  { name: 'Q70 5.6', model_id: 22034 },
  { name: 'Q70 Hybrid', model_id: 22035 },
  // QX30
  { name: 'QX30', model_id: 22040 },
  { name: 'QX30 2.0t', model_id: 22041 },
  // QX50
  { name: 'QX50', model_id: 22050 },
  { name: 'QX50 2.0t', model_id: 22051 },
  { name: 'QX50 3.5', model_id: 22052 },
  { name: 'QX50 3.7', model_id: 22053 },
  // QX55
  { name: 'QX55', model_id: 22060 },
  { name: 'QX55 2.0t', model_id: 22061 },
  // QX60
  { name: 'QX60', model_id: 22070 },
  { name: 'QX60 2.5 Hybrid', model_id: 22071 },
  { name: 'QX60 3.5', model_id: 22072 },
  // QX70
  { name: 'QX70', model_id: 22080 },
  { name: 'QX70 3.0d', model_id: 22081 },
  { name: 'QX70 3.7', model_id: 22082 },
  { name: 'QX70 5.0', model_id: 22083 },
  // QX80
  { name: 'QX80', model_id: 22090 },
  { name: 'QX80 5.6', model_id: 22091 },
  // G35/G37
  { name: 'G35', model_id: 22100 },
  { name: 'G37', model_id: 22101 },
  { name: 'G37 Coupe', model_id: 22102 },
  { name: 'G37 Convertible', model_id: 22103 },
  // FX35/FX45/FX50
  { name: 'FX35', model_id: 22110 },
  { name: 'FX37', model_id: 22111 },
  { name: 'FX45', model_id: 22112 },
  { name: 'FX50', model_id: 22113 },
  // EX35/EX37
  { name: 'EX35', model_id: 22120 },
  { name: 'EX37', model_id: 22121 },
  // M35/M37/M45/M56
  { name: 'M35', model_id: 22130 },
  { name: 'M37', model_id: 22131 },
  { name: 'M45', model_id: 22132 },
  { name: 'M56', model_id: 22133 },
  // Другие
  { name: 'Другая модель', model_id: 22999 },
];

// Все модели Acura
const ACURA_MODELS: CarModel[] = [
  // ILX
  { name: 'ILX', model_id: 23001 },
  { name: 'ILX 2.0', model_id: 23002 },
  { name: 'ILX 2.4', model_id: 23003 },
  // TLX
  { name: 'TLX', model_id: 23010 },
  { name: 'TLX 2.0T', model_id: 23011 },
  { name: 'TLX 2.4', model_id: 23012 },
  { name: 'TLX 3.5', model_id: 23013 },
  { name: 'TLX Type S', model_id: 23014 },
  // RLX
  { name: 'RLX', model_id: 23020 },
  { name: 'RLX 3.5', model_id: 23021 },
  { name: 'RLX Sport Hybrid', model_id: 23022 },
  // Integra
  { name: 'Integra', model_id: 23030 },
  { name: 'Integra 1.5T', model_id: 23031 },
  { name: 'Integra Type S', model_id: 23032 },
  // TSX
  { name: 'TSX', model_id: 23040 },
  { name: 'TSX 2.4', model_id: 23041 },
  { name: 'TSX 3.5', model_id: 23042 },
  { name: 'TSX Sport Wagon', model_id: 23043 },
  // TL
  { name: 'TL', model_id: 23050 },
  { name: 'TL 3.2', model_id: 23051 },
  { name: 'TL 3.5', model_id: 23052 },
  { name: 'TL 3.7', model_id: 23053 },
  // RL
  { name: 'RL', model_id: 23060 },
  { name: 'RL 3.5', model_id: 23061 },
  { name: 'RL 3.7', model_id: 23062 },
  // RDX
  { name: 'RDX', model_id: 23070 },
  { name: 'RDX 2.0T', model_id: 23071 },
  { name: 'RDX 3.5', model_id: 23072 },
  // MDX
  { name: 'MDX', model_id: 23080 },
  { name: 'MDX 3.5', model_id: 23081 },
  { name: 'MDX 3.7', model_id: 23082 },
  { name: 'MDX Type S', model_id: 23083 },
  { name: 'MDX Sport Hybrid', model_id: 23084 },
  // ZDX
  { name: 'ZDX', model_id: 23090 },
  { name: 'ZDX 3.7', model_id: 23091 },
  { name: 'ZDX EV', model_id: 23092 },
  // NSX
  { name: 'NSX', model_id: 23100 },
  { name: 'NSX Type S', model_id: 23101 },
  // RSX
  { name: 'RSX', model_id: 23110 },
  { name: 'RSX Type S', model_id: 23111 },
  // Другие
  { name: 'Другая модель', model_id: 23999 },
];

// Все модели Cadillac
const CADILLAC_MODELS: CarModel[] = [
  // CT4
  { name: 'CT4', model_id: 24001 },
  { name: 'CT4 2.0T', model_id: 24002 },
  { name: 'CT4-V', model_id: 24003 },
  { name: 'CT4-V Blackwing', model_id: 24004 },
  // CT5
  { name: 'CT5', model_id: 24010 },
  { name: 'CT5 2.0T', model_id: 24011 },
  { name: 'CT5 3.0T', model_id: 24012 },
  { name: 'CT5-V', model_id: 24013 },
  { name: 'CT5-V Blackwing', model_id: 24014 },
  // CT6
  { name: 'CT6', model_id: 24020 },
  { name: 'CT6 2.0T', model_id: 24021 },
  { name: 'CT6 3.0T', model_id: 24022 },
  { name: 'CT6 3.6', model_id: 24023 },
  { name: 'CT6 4.2T V8', model_id: 24024 },
  { name: 'CT6-V', model_id: 24025 },
  { name: 'CT6 Plug-in Hybrid', model_id: 24026 },
  // ATS
  { name: 'ATS', model_id: 24030 },
  { name: 'ATS 2.0T', model_id: 24031 },
  { name: 'ATS 2.5', model_id: 24032 },
  { name: 'ATS 3.6', model_id: 24033 },
  { name: 'ATS-V', model_id: 24034 },
  { name: 'ATS Coupe', model_id: 24035 },
  // CTS
  { name: 'CTS', model_id: 24040 },
  { name: 'CTS 2.0T', model_id: 24041 },
  { name: 'CTS 2.8', model_id: 24042 },
  { name: 'CTS 3.0', model_id: 24043 },
  { name: 'CTS 3.6', model_id: 24044 },
  { name: 'CTS-V', model_id: 24045 },
  { name: 'CTS Sport Wagon', model_id: 24046 },
  // XTS
  { name: 'XTS', model_id: 24050 },
  { name: 'XTS 3.6', model_id: 24051 },
  { name: 'XTS V-Sport', model_id: 24052 },
  // XT4
  { name: 'XT4', model_id: 24060 },
  { name: 'XT4 2.0T', model_id: 24061 },
  // XT5
  { name: 'XT5', model_id: 24070 },
  { name: 'XT5 2.0T', model_id: 24071 },
  { name: 'XT5 3.6', model_id: 24072 },
  // XT6
  { name: 'XT6', model_id: 24080 },
  { name: 'XT6 2.0T', model_id: 24081 },
  { name: 'XT6 3.6', model_id: 24082 },
  // Escalade
  { name: 'Escalade', model_id: 24090 },
  { name: 'Escalade 6.2', model_id: 24091 },
  { name: 'Escalade ESV', model_id: 24092 },
  { name: 'Escalade-V', model_id: 24093 },
  // SRX
  { name: 'SRX', model_id: 24100 },
  { name: 'SRX 2.8', model_id: 24101 },
  { name: 'SRX 3.0', model_id: 24102 },
  { name: 'SRX 3.6', model_id: 24103 },
  // Lyriq
  { name: 'Lyriq', model_id: 24110 },
  // Celestiq
  { name: 'Celestiq', model_id: 24115 },
  // DTS
  { name: 'DTS', model_id: 24120 },
  { name: 'DTS 4.6', model_id: 24121 },
  // STS
  { name: 'STS', model_id: 24130 },
  { name: 'STS 3.6', model_id: 24131 },
  { name: 'STS 4.6', model_id: 24132 },
  { name: 'STS-V', model_id: 24133 },
  // Другие
  { name: 'Другая модель', model_id: 24999 },
];

// Все модели Genesis
const GENESIS_MODELS: CarModel[] = [
  // G70
  { name: 'G70', model_id: 25001 },
  { name: 'G70 2.0T', model_id: 25002 },
  { name: 'G70 2.5T', model_id: 25003 },
  { name: 'G70 3.3T', model_id: 25004 },
  { name: 'G70 Shooting Brake', model_id: 25005 },
  // G80
  { name: 'G80', model_id: 25010 },
  { name: 'G80 2.5T', model_id: 25011 },
  { name: 'G80 3.5T', model_id: 25012 },
  { name: 'G80 3.3T', model_id: 25013 },
  { name: 'G80 Sport', model_id: 25014 },
  { name: 'Electrified G80', model_id: 25015 },
  // G90
  { name: 'G90', model_id: 25020 },
  { name: 'G90 3.3T', model_id: 25021 },
  { name: 'G90 3.5T', model_id: 25022 },
  { name: 'G90 5.0', model_id: 25023 },
  // GV60
  { name: 'GV60', model_id: 25030 },
  { name: 'GV60 Standard', model_id: 25031 },
  { name: 'GV60 Performance', model_id: 25032 },
  // GV70
  { name: 'GV70', model_id: 25040 },
  { name: 'GV70 2.5T', model_id: 25041 },
  { name: 'GV70 3.5T', model_id: 25042 },
  { name: 'Electrified GV70', model_id: 25043 },
  // GV80
  { name: 'GV80', model_id: 25050 },
  { name: 'GV80 2.5T', model_id: 25051 },
  { name: 'GV80 3.0D', model_id: 25052 },
  { name: 'GV80 3.5T', model_id: 25053 },
  { name: 'GV80 Coupe', model_id: 25054 },
  // X Convertible (концепт)
  { name: 'X Convertible', model_id: 25060 },
  // Другие
  { name: 'Другая модель', model_id: 25999 },
];

// Объединённые данные марок и моделей
const ALL_BRANDS: Brand[] = [
  { name: 'Mercedes-Benz', make_id: 449 },
  { name: 'BMW', make_id: 452 },
  { name: 'Audi', make_id: 453 },
  { name: 'Volkswagen', make_id: 454 },
  { name: 'Toyota', make_id: 455 },
  { name: 'Hyundai', make_id: 200 },
  { name: 'Kia', make_id: 456 },
  { name: 'Nissan', make_id: 457 },
  { name: 'Honda', make_id: 458 },
  { name: 'Lexus', make_id: 459 },
  { name: 'Ford', make_id: 460 },
  { name: 'Chevrolet', make_id: 461 },
  { name: 'Mazda', make_id: 462 },
  { name: 'Subaru', make_id: 463 },
  { name: 'Mitsubishi', make_id: 464 },
  { name: 'Porsche', make_id: 465 },
  { name: 'Land Rover', make_id: 466 },
  { name: 'Jeep', make_id: 467 },
  { name: 'Volvo', make_id: 468 },
  { name: 'Peugeot', make_id: 469 },
  { name: 'Renault', make_id: 470 },
  { name: 'Skoda', make_id: 471 },
  { name: 'Infiniti', make_id: 472 },
  { name: 'Acura', make_id: 473 },
  { name: 'Cadillac', make_id: 474 },
  { name: 'Genesis', make_id: 475 },
];

const MODELS_BY_BRAND: { [key: number]: CarModel[] } = {
  449: MERCEDES_MODELS, // Mercedes-Benz
  452: BMW_MODELS,      // BMW
  453: AUDI_MODELS,     // Audi
  454: VW_MODELS,       // Volkswagen
  455: TOYOTA_MODELS,   // Toyota
  200: HYUNDAI_MODELS,  // Hyundai
  456: KIA_MODELS,      // Kia
  457: NISSAN_MODELS,   // Nissan
  458: HONDA_MODELS,    // Honda
  459: LEXUS_MODELS,    // Lexus
  460: FORD_MODELS,     // Ford
  461: CHEVROLET_MODELS, // Chevrolet
  462: MAZDA_MODELS,    // Mazda
  463: SUBARU_MODELS,   // Subaru
  464: MITSUBISHI_MODELS, // Mitsubishi
  465: PORSCHE_MODELS,  // Porsche
  466: LAND_ROVER_MODELS, // Land Rover
  467: JEEP_MODELS,     // Jeep
  468: VOLVO_MODELS,    // Volvo
  469: PEUGEOT_MODELS,  // Peugeot
  470: RENAULT_MODELS,  // Renault
  471: SKODA_MODELS,    // Skoda
  472: INFINITI_MODELS, // Infiniti
  473: ACURA_MODELS,    // Acura
  474: CADILLAC_MODELS, // Cadillac
  475: GENESIS_MODELS,  // Genesis
};

// Логотипы брендов
const BRAND_LOGOS: { [key: string]: string } = {
  'Mercedes-Benz': 'https://www.carlogos.org/car-logos/mercedes-benz-logo-2011-1920x1080.png',
  'BMW': 'https://www.carlogos.org/car-logos/bmw-logo-2020-grey.png',
  'Audi': 'https://www.carlogos.org/car-logos/audi-logo-2016.png',
  'Volkswagen': 'https://www.carlogos.org/car-logos/volkswagen-logo-2019-1500x1500.png',
  'Toyota': 'https://www.carlogos.org/car-logos/toyota-logo-2019-3700x1200.png',
  'Hyundai': 'https://www.carlogos.org/car-logos/hyundai-logo-2011-1920x1080.png',
  'Kia': 'https://www.carlogos.org/car-logos/kia-logo-2021-2560x1440.png',
  'Nissan': 'https://www.carlogos.org/car-logos/nissan-logo-2020-black.png',
  'Honda': 'https://www.carlogos.org/car-logos/honda-logo-1700x1150.png',
  'Lexus': 'https://www.carlogos.org/car-logos/lexus-logo-1988-1920x1080.png',
  'Ford': 'https://www.carlogos.org/car-logos/ford-logo-2017-1500x1101.png',
  'Chevrolet': 'https://www.carlogos.org/car-logos/chevrolet-logo-2013-2560x1440.png',
  'Mazda': 'https://www.carlogos.org/car-logos/mazda-logo-2018-1920x1080.png',
  'Subaru': 'https://www.carlogos.org/car-logos/subaru-logo-2019-1920x1080.png',
  'Mitsubishi': 'https://www.carlogos.org/car-logos/mitsubishi-logo-2000x2500.png',
  'Porsche': 'https://www.carlogos.org/car-logos/porsche-logo-2014-1920x1080.png',
  'Land Rover': 'https://www.carlogos.org/car-logos/land-rover-logo-2020-green.png',
  'Jeep': 'https://www.carlogos.org/car-logos/jeep-logo-1993-1920x1080.png',
  'Volvo': 'https://www.carlogos.org/car-logos/volvo-logo-2014-1920x1080.png',
  'Peugeot': 'https://www.carlogos.org/car-logos/peugeot-logo-2010-1920x1080.png',
  'Renault': 'https://www.carlogos.org/car-logos/renault-logo-2021-1920x1080.png',
  'Skoda': 'https://www.carlogos.org/car-logos/skoda-logo-2016-1920x1080.png',
  'Infiniti': 'https://www.carlogos.org/car-logos/infiniti-logo-1989-1920x1080.png',
  'Acura': 'https://www.carlogos.org/car-logos/acura-logo-1990-1920x1080.png',
  'Cadillac': 'https://www.carlogos.org/car-logos/cadillac-logo-2014-1920x1080.png',
  'Genesis': 'https://www.carlogos.org/car-logos/genesis-logo-2020-1920x1080.png',
};

const getBrandLogo = (brandName: string): string => {
  return BRAND_LOGOS[brandName] || 'https://www.carlogos.org/car-logos/car-logo.png';
};

export default function AddCarDetailScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [bodyTypeModalVisible, setBodyTypeModalVisible] = useState(false);
  const [engineVolumeModalVisible, setEngineVolumeModalVisible] = useState(false);
  const [featuresModalVisible, setFeaturesModalVisible] = useState(false);
  const [brandModalVisible, setBrandModalVisible] = useState(false);

  // Brands and Models state
  const [brands] = useState<Brand[]>(ALL_BRANDS);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedModel, setSelectedModel] = useState<CarModel | null>(null);
  const [models, setModels] = useState<CarModel[]>([]);
  const [brandsLoading] = useState(false);
  const [modelsLoading] = useState(false);

  const categories = [
    { value: 'cars', label: 'Автомобили', icon: '🚗' },
    { value: 'electric', label: 'Электромобили', icon: '⚡' },
    { value: 'motorcycles', label: 'Мотоциклы', icon: '🏍️' },
    { value: 'trucks', label: 'Грузовики', icon: '🚚' },
    { value: 'parts', label: 'Запчасти', icon: '🔧' },
    { value: 'rent', label: 'Аренда авто', icon: '🔑' },
  ];

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    price: '',
    mileage: '',
    engineType: 'petrol',
    engineVolume: null as number | null,
    bodyType: '',
    transmission: 'automatic',
    driveType: 'rear',
    condition: 'used',
    color: '',
    region: 'dushanbe',
    category: 'cars',
    description: '',
    features: [] as string[],
  });

  const handleBrandSelect = (brand: Brand) => {
    setSelectedBrand(brand);
    setSelectedModel(null);
    setFormData(prev => ({ ...prev, brand: brand.name, model: '' }));
    setModels(MODELS_BY_BRAND[brand.make_id] || []);
    setBrandModalVisible(false);
  };

  const handleModelSelect = (option: { label: string; value: string | number }) => {
    const model = models.find(m => m.name === option.label);
    if (model) {
      setSelectedModel(model);
      setFormData(prev => ({ ...prev, model: model.name }));
    }
  };

  const brandOptions = brands.map(b => ({
    label: b.name,
    value: b.make_id.toString(),
    id: b.make_id,
  }));

  const modelOptions = models.map(m => ({
    label: m.name,
    value: m.model_id?.toString() || m.name,
    id: m.model_id,
  }));

  const toggleFeature = (featureValue: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(featureValue)
        ? prev.features.filter(f => f !== featureValue)
        : [...prev.features, featureValue]
    }));
  };

  const pickImage = async () => {
    if (photos.length >= 10) {
      Alert.alert(t('messages.error'), 'Максимум 10 фотографий');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('messages.error'), 'Нужно разрешение на доступ к галерее');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPhotos([...photos, base64Image]);
    }
  };

  const takePhoto = async () => {
    if (photos.length >= 10) {
      Alert.alert(t('messages.error'), 'Максимум 10 фотографий');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('messages.error'), 'Нужно разрешение на доступ к камере');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPhotos([...photos, base64Image]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.brand || !formData.model) {
      Alert.alert(t('messages.error'), 'Заполните марку и модель');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert(t('messages.error'), 'Укажите корректную цену');
      return false;
    }
    if (!formData.mileage || parseInt(formData.mileage) < 0) {
      Alert.alert(t('messages.error'), 'Укажите корректный пробег');
      return false;
    }
    if (photos.length === 0) {
      Alert.alert(t('messages.error'), 'Добавьте хотя бы одну фотографию');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!validateForm()) return;

    setLoading(true);
    try {
      const carData = {
        ...formData,
        year: parseInt(formData.year),
        price: parseFloat(formData.price),
        mileage: parseInt(formData.mileage),
        photos,
        sellerPhone: user.phone,
        sellerId: user._id || user.phone,
        status: 'pending' as const,
      };

      await carAPI.create(carData as any);
      Alert.alert(
        t('messages.success'),
        'Объявление отправлено на модерацию',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }]
      );
    } catch (error) {
      console.error('Error creating listing:', error);
      Alert.alert(t('messages.error'), 'Не удалось создать объявление');
    } finally {
      setLoading(false);
    }
  };

  const SectionHeader = ({ title, required = false }: { title: string; required?: boolean }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {required && <Text style={styles.requiredBadge}>Обязательно</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.replace('/(tabs)/home')} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Новое объявление</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Photos Section */}
        <View style={styles.card}>
          <SectionHeader title="📷 Фотографии" required />
          <View style={styles.photosContainer}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoWrapper}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={() => removePhoto(index)}
                >
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 10 && (
              <>
                <TouchableOpacity style={styles.addPhotoButton} onPress={takePhoto}>
                  <Ionicons name="camera" size={28} color="#0066FF" />
                  <Text style={styles.addPhotoText}>Камера</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                  <Ionicons name="images" size={28} color="#0066FF" />
                  <Text style={styles.addPhotoText}>Галерея</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          <View style={styles.photoProgress}>
            <View style={[styles.photoProgressBar, { width: `${(photos.length / 10) * 100}%` }]} />
          </View>
          <Text style={styles.photoCount}>{photos.length}/10 фото</Text>
        </View>

        {/* Category */}
        <View style={styles.card}>
          <SectionHeader title="📁 Категория" required />
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setCategoryModalVisible(true)}
          >
            <View style={styles.selectFieldContent}>
              <Text style={styles.selectFieldIcon}>
                {categories.find(c => c.value === formData.category)?.icon}
              </Text>
              <Text style={styles.selectFieldText}>
                {categories.find(c => c.value === formData.category)?.label}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Brand & Model */}
        <View style={styles.card}>
          <SectionHeader title="🚗 Марка и модель" required />
          
          {/* Brand Selection */}
          <Text style={styles.fieldLabel}>Марка</Text>
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setBrandModalVisible(true)}
          >
            {selectedBrand ? (
              <View style={styles.brandSelectedRow}>
                <Image 
                  source={{ uri: getBrandLogo(selectedBrand.name) }} 
                  style={styles.brandSelectLogo}
                  resizeMode="contain"
                />
                <Text style={styles.selectFieldText}>{selectedBrand.name}</Text>
              </View>
            ) : (
              <Text style={[styles.selectFieldText, styles.placeholder]}>
                Выберите марку
              </Text>
            )}
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
          
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Модель</Text>
          <SearchableSelect
            title={selectedBrand ? `Модели ${selectedBrand.name}` : "Выберите модель"}
            placeholder="Выберите модель"
            value={formData.model}
            options={modelOptions}
            onSelect={handleModelSelect}
            loading={modelsLoading}
            disabled={!selectedBrand}
            disabledPlaceholder="Сначала выберите марку"
            emptyText="Модели не найдены"
          />
        </View>

        {/* Main Specs */}
        <View style={styles.card}>
          <SectionHeader title="📊 Основные характеристики" required />
          
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Год выпуска</Text>
              <TextInput
                style={styles.input}
                value={formData.year}
                onChangeText={(text) => setFormData({ ...formData, year: text })}
                keyboardType="numeric"
                placeholder="2020"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Пробег (км)</Text>
              <TextInput
                style={styles.input}
                value={formData.mileage}
                onChangeText={(text) => setFormData({ ...formData, mileage: text })}
                keyboardType="numeric"
                placeholder="50000"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Цена (TJS)</Text>
          <View style={styles.priceInputContainer}>
            <TextInput
              style={[styles.input, styles.priceInput]}
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="numeric"
              placeholder="85,000"
              placeholderTextColor="#94A3B8"
            />
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyText}>TJS</Text>
            </View>
          </View>
        </View>

        {/* Technical Specs */}
        <View style={styles.card}>
          <SectionHeader title="⚙️ Технические данные" />
          
          {/* Body Type */}
          <Text style={styles.fieldLabel}>Тип кузова</Text>
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setBodyTypeModalVisible(true)}
          >
            <Text style={[styles.selectFieldText, !formData.bodyType && styles.placeholder]}>
              {formData.bodyType ? BODY_TYPES.find(b => b.value === formData.bodyType)?.label : 'Выберите тип кузова'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* Engine Type */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Тип двигателя</Text>
          <View style={styles.chipContainer}>
            {[
              { value: 'petrol', label: 'Бензин', icon: '⛽' },
              { value: 'diesel', label: 'Дизель', icon: '🛢️' },
              { value: 'electric', label: 'Электро', icon: '⚡' },
              { value: 'hybrid', label: 'Гибрид', icon: '🔋' },
            ].map(type => (
              <TouchableOpacity
                key={type.value}
                style={[styles.chip, formData.engineType === type.value && styles.chipActive]}
                onPress={() => setFormData({ ...formData, engineType: type.value })}
              >
                <Text style={styles.chipIcon}>{type.icon}</Text>
                <Text style={[styles.chipText, formData.engineType === type.value && styles.chipTextActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Engine Volume */}
          {formData.engineType !== 'electric' && (
            <>
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Объём двигателя</Text>
              <TouchableOpacity
                style={styles.selectField}
                onPress={() => setEngineVolumeModalVisible(true)}
              >
                <Text style={[styles.selectFieldText, !formData.engineVolume && styles.placeholder]}>
                  {formData.engineVolume ? `${formData.engineVolume} л` : 'Выберите объём'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </>
          )}

          {/* Transmission */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>КПП</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, formData.transmission === 'manual' && styles.toggleActive]}
              onPress={() => setFormData({ ...formData, transmission: 'manual' })}
            >
              <Text style={[styles.toggleText, formData.transmission === 'manual' && styles.toggleTextActive]}>
                Механика
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, formData.transmission === 'automatic' && styles.toggleActive]}
              onPress={() => setFormData({ ...formData, transmission: 'automatic' })}
            >
              <Text style={[styles.toggleText, formData.transmission === 'automatic' && styles.toggleTextActive]}>
                Автомат
              </Text>
            </TouchableOpacity>
          </View>

          {/* Drive Type */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Привод</Text>
          <View style={styles.chipContainer}>
            {[
              { value: 'front', label: 'Передний' },
              { value: 'rear', label: 'Задний' },
              { value: 'awd', label: 'Полный' },
            ].map(type => (
              <TouchableOpacity
                key={type.value}
                style={[styles.chip, styles.chipSmall, formData.driveType === type.value && styles.chipActive]}
                onPress={() => setFormData({ ...formData, driveType: type.value })}
              >
                <Text style={[styles.chipText, formData.driveType === type.value && styles.chipTextActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Condition & Color */}
        <View style={styles.card}>
          <SectionHeader title="🎨 Состояние и цвет" />
          
          <Text style={styles.fieldLabel}>Состояние</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, formData.condition === 'new' && styles.toggleActiveGreen]}
              onPress={() => setFormData({ ...formData, condition: 'new' })}
            >
              <Text style={[styles.toggleText, formData.condition === 'new' && styles.toggleTextActive]}>
                ✨ Новый
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, formData.condition === 'used' && styles.toggleActive]}
              onPress={() => setFormData({ ...formData, condition: 'used' })}
            >
              <Text style={[styles.toggleText, formData.condition === 'used' && styles.toggleTextActive]}>
                С пробегом
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Цвет</Text>
          <TextInput
            style={styles.input}
            value={formData.color}
            onChangeText={(text) => setFormData({ ...formData, color: text })}
            placeholder="Например: Белый, Чёрный металлик"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Features */}
        <View style={styles.card}>
          <SectionHeader title="✅ Опции и комплектация" />
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setFeaturesModalVisible(true)}
          >
            <Text style={[styles.selectFieldText, formData.features.length === 0 && styles.placeholder]}>
              {formData.features.length > 0 
                ? `Выбрано: ${formData.features.length} опций`
                : 'Выберите опции автомобиля'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
          
          {formData.features.length > 0 && (
            <View style={styles.selectedFeatures}>
              {formData.features.slice(0, 5).map(f => (
                <View key={f} style={styles.featureTag}>
                  <Text style={styles.featureTagText}>
                    {CAR_FEATURES.find(cf => cf.value === f)?.label}
                  </Text>
                </View>
              ))}
              {formData.features.length > 5 && (
                <View style={styles.featureTag}>
                  <Text style={styles.featureTagText}>+{formData.features.length - 5}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Location */}
        <View style={styles.card}>
          <SectionHeader title="📍 Регион" required />
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setRegionModalVisible(true)}
          >
            <Ionicons name="location" size={20} color="#0066FF" />
            <Text style={styles.selectFieldText}>
              {t(`regions.${formData.region}`)}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <SectionHeader title="📝 Описание" />
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Расскажите о состоянии автомобиля, истории обслуживания, причине продажи..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={24} color="#FFFFFF" />
              <Text style={styles.submitText}>Опубликовать объявление</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Объявление будет проверено модератором перед публикацией
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      {/* Brand Modal */}
      <Modal visible={brandModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите марку</Text>
              <TouchableOpacity onPress={() => setBrandModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={brands}
              keyExtractor={(item) => item.make_id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, styles.brandModalItem]}
                  onPress={() => handleBrandSelect(item)}
                >
                  <Image 
                    source={{ uri: getBrandLogo(item.name) }} 
                    style={styles.brandModalLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.brandModalText}>{item.name}</Text>
                  {selectedBrand?.make_id === item.make_id && (
                    <Ionicons name="checkmark-circle" size={24} color="#0066FF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Category Modal */}
      <Modal visible={categoryModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите категорию</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({ ...formData, category: item.value });
                    setCategoryModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemIcon}>{item.icon}</Text>
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {formData.category === item.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#0066FF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Body Type Modal */}
      <Modal visible={bodyTypeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Тип кузова</Text>
              <TouchableOpacity onPress={() => setBodyTypeModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={BODY_TYPES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({ ...formData, bodyType: item.value });
                    setBodyTypeModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {formData.bodyType === item.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#0066FF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Engine Volume Modal */}
      <Modal visible={engineVolumeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Объём двигателя</Text>
              <TouchableOpacity onPress={() => setEngineVolumeModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={ENGINE_VOLUMES}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({ ...formData, engineVolume: item.value });
                    setEngineVolumeModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {formData.engineVolume === item.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#0066FF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Region Modal */}
      <Modal visible={regionModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите регион</Text>
              <TouchableOpacity onPress={() => setRegionModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={REGIONS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({ ...formData, region: item.value });
                    setRegionModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{t(item.label)}</Text>
                  {formData.region === item.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#0066FF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Features Modal */}
      <Modal visible={featuresModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Опции ({formData.features.length})</Text>
              <TouchableOpacity onPress={() => setFeaturesModalVisible(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CAR_FEATURES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, formData.features.includes(item.value) && styles.modalItemSelected]}
                  onPress={() => toggleFeature(item.value)}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  <View style={[styles.checkbox, formData.features.includes(item.value) && styles.checkboxActive]}>
                    {formData.features.includes(item.value) && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalDoneButton}
                onPress={() => setFeaturesModalVisible(false)}
              >
                <Text style={styles.modalDoneText}>Готово</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  requiredBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0066FF',
    backgroundColor: '#E8F1FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  brandHeaderLogo: {
    width: 48,
    height: 48,
  },
  brandHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  brandSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  brandSelectLogo: {
    width: 32,
    height: 32,
  },
  brandModalItem: {
    paddingVertical: 20,
  },
  brandModalLogo: {
    width: 48,
    height: 48,
  },
  brandModalText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  currencyBadge: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  currencyText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  selectField: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  selectFieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  selectFieldIcon: {
    fontSize: 24,
  },
  selectFieldText: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
  },
  placeholder: {
    color: '#94A3B8',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipSmall: {
    flex: 1,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#E8F1FF',
    borderColor: '#0066FF',
  },
  chipIcon: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#0066FF',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleActive: {
    backgroundColor: '#0066FF',
  },
  toggleActiveGreen: {
    backgroundColor: '#10B981',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  selectedFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  featureTag: {
    backgroundColor: '#E8F1FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  featureTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066FF',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    width: 90,
    height: 90,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0066FF',
  },
  photoProgress: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  photoProgressBar: {
    height: '100%',
    backgroundColor: '#0066FF',
    borderRadius: 2,
  },
  photoCount: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#0066FF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  modalItemSelected: {
    backgroundColor: '#F8FAFC',
  },
  modalItemIcon: {
    fontSize: 24,
  },
  modalItemText: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  modalDoneButton: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalDoneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
