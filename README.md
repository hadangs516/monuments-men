# 모뉴먼츠 맨 · 사라진 제단화

[게임 플레이](https://hadangs516.github.io/monuments-men/) · [기획과 퍼즐 설계](docs/design.md) · [공유 포스터](assets/share.jpg)

1945년, 헨트에서 편지 한 통이 도착한다. 연합군 문화재 전담반 조사관이 되어 바이에른의 성에서 운송 기록을 대조하고, 알타우스제의 광산에서 그림을 식별하고, 뮌헨에서 반환 인계증에 서명하는 한국어 추리 어드벤처다.

터치와 마우스, Tab·Enter·Esc로 조작한다. 조사 결과는 해당 브라우저에 자동 저장된다. 현장마다 개인 기록을 하나씩 더 찾을 수 있으며, 수집한 기록은 마지막 편지에 반영된다.

## 실행과 검수

정적 웹 게임으로 별도의 빌드 과정이 없다. 저장소 루트에서 `python -m http.server 8176 --bind 127.0.0.1`을 실행한 뒤 브라우저에서 로컬 서버를 연다. `checks/playthrough.py`는 Python Playwright, Chrome과 Playwright WebKit을 사용한다. 인수로 미리보기 주소나 공개 URL을 지정할 수 있다. `checks/release.py`는 Pillow를 사용해 공개된 파일, 공유 이미지와 아이콘을 확인한다.

## 제작 자료

- 역사적 이동과 반환 절차는 미국 국립문서기록관리청 자료에 근거한다. 조사관, 리네의 편지, 현장 단서와 퍼즐은 게임을 위해 창작했다. [벨기에 미술품 회수 기록](https://text-message.blogs.archives.gov/2015/10/15/monuments-men-august-1945/)
- 현장 모습은 게임을 위해 새로 만든 삽화다. 사진 대조 퍼즐과 엔딩에 등장하는 실물 도판은 헨트 제단화 중앙 하단 패널의 공개 도메인 복제다. [Wikimedia Commons 작품 정보](https://commons.wikimedia.org/wiki/File:Ghent_Altarpiece_Mystic_Lamb.jpg)
- 제목 서체는 나눔명조 Bold를 게임에 사용되는 문자로 줄인 Field Archive Serif다. [글꼴 라이선스](assets/FONT-LICENSE.txt)
