/* One evening, one room. The judgment changes before the people do. */
(() => {
  const beat = (kicker, html, visual, time, hold = 4.5, description = '', voice = '') => ({kicker, html, visual, time, hold, description, voice});
  window.MZStory = {
    prologue: [
      beat('금요일 · 동네 모임', '모임이 시작될 무렵,<br>문이 다시 열렸다.', -2, 2, 4.2),
      beat('처음 온 서아', '“저… 여기 처음 왔는데요.”', -2, 7, 4.6, '', 'seoa_intro')
    ],
    chapters: [
      {
        name: '빈자리', action: '처음 온 서아가 문 앞에 서자 지윤이 옆의 의자를 내어준다.',
        speaker: '모임 운영자 · 민호', label: 'MZ 같지 않게<br>참 살갑네요.', labelVoice: 'minho_label_one',
        observation: [
          beat('지윤', '“여기 자리 있어요.<br>같이 보셔도 돼요.”', 0, 3, 4.8, '', 'jiyoon_seat'),
          beat('서아', '“고맙습니다.<br>어디 앉나 했어요.”', 0, 8, 4.2, '', 'seoa_thanks')
        ],
        memory: [
          beat('3주 전 · 같은 문 앞', '지윤도 가방을 안은 채<br>빈 의자를 바라봤다.', -1, 3, 4.5),
          beat('지윤', '“저도 처음엔 저 앞에서<br>한참 서 있었거든요.”', 0, 8, 5.1, '', 'jiyoon_memory')
        ]
      },
      {
        name: '더해진 부탁', action: '모임이 끝난 뒤, 민호가 지윤에게 자료를 나눠 달라고 부탁한다.',
        speaker: '모임 운영자 · 민호', label: '요즘 사람 같지 않게<br>참 책임감 있네요.', labelVoice: 'minho_label_two',
        observation: [
          beat('모임이 끝난 뒤 · 민호', '“지윤 씨, 이 종이 좀<br>같이 나눠줄래요?”', 1, 2, 4.8, '', 'minho_papers'),
          beat('지윤', '“네. 이쪽은 제가 할게요.”', 1, 7, 4.0, '', 'jiyoon_accept')
        ],
        memory: [
          beat('지윤의 휴대폰', '21:10 막차<br>출발까지 12분', 1, 7, 4.4, '자료를 나누는 지윤의 가방 옆 휴대폰에 막차 알림이 켜진다.'),
          beat('지윤', '마지막 한 장을 놓고<br>가방 끈을 다시 잡았다.', 1, 8, 4.2, '지윤이 마지막 종이를 놓고 가방 끈을 잡는다.')
        ]
      },
      {
        name: '돌아가야 할 시간', action: '민호가 지윤에게 의자 정리를 한 번 더 부탁한다.',
        speaker: '민호의 무심한 한마디', label: '역시 요즘 사람은<br>시간에 칼 같네.', labelVoice: 'minho_label_three',
        observation: [
          beat('민호', '“지윤 씨, 의자도<br>정리해 줄 수 있어요?”', 2, 2, 4.5, '', 'minho_chairs'),
          beat('지윤', '“죄송해요. 오늘은<br>여기까지만 할게요.”', 2, 5, 4.7, '', 'jiyoon_refuse')
        ],
        memory: [
          beat('지윤의 휴대폰', '21:10 막차<br>출발까지 4분', 2, 6, 4.8, '지윤이 문 앞에 서 있고 휴대폰의 막차 알림이 켜진다.'),
          beat('지윤', '“막차가 4분 뒤라서요.”', 2, 8, 4.4, '지윤이 민호를 보며 막차를 말한다.', 'jiyoon_bus'),
          beat('민호', '“아, 그랬어요?<br>얼른 가요. 제가 할게요.”', 3, 3, 4.8, '민호가 의자 쪽으로 다가서며 지윤을 보낸다.', 'minho_understand')
        ]
      }
    ],
    closing: [
      beat('서아', '“저도 이쪽 의자<br>정리할게요.”', 3, 5, 4.4, '', 'seoa_help'),
      beat('지윤', '“고마워요.<br>다음 주에 봬요.”', 3, 7, 4.4, '', 'jiyoon_thanks'),
      {...beat('민호', '<span class="old-judgment">MZ 같지 않네요.</span><br><span class="new-question" aria-hidden="true">“조심히 가요, 지윤 씨.”</span>', 3, 8, 5.3, '', 'minho_farewell'), mode: 'replacement'}
    ]
  };
})();
